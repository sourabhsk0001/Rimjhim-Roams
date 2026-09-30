-- ==============================================================================
-- Migration: 20241007000000_collaboration_and_splitting.sql
-- Description: Phase 12 Trip Collaboration, Group Voting, and Expense Splitting
-- ==============================================================================

-- 1. Trip Invitations Table
CREATE TABLE IF NOT EXISTS public.trip_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  inviter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_email varchar(255) NOT NULL,
  invitee_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_invitations_trip_id ON public.trip_invitations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_email ON public.trip_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_token ON public.trip_invitations(token);

-- 2. Group Polls Table
CREATE TABLE IF NOT EXISTS public.group_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  deadline timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_group_polls_trip_id ON public.group_polls(trip_id);

-- 3. Group Votes Table
CREATE TABLE IF NOT EXISTS public.group_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.group_polls(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  option_id varchar(100) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_votes_poll_id ON public.group_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_group_votes_trip_id ON public.group_votes(trip_id);
CREATE INDEX IF NOT EXISTS idx_group_votes_user_id ON public.group_votes(user_id);

-- 4. Alter Expenses Table for Collaborations (if columns not present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'paid_by'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN paid_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'split_type'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN split_type varchar(50) DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom', 'percentage'));
  END IF;
END $$;

-- 5. Expense Participants Table
CREATE TABLE IF NOT EXISTS public.expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_amount_minor_units bigint NOT NULL CHECK (share_amount_minor_units >= 0),
  share_percentage numeric(5, 2) DEFAULT NULL,
  has_settled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(expense_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_trip_id ON public.expense_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE public.trip_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

-- Trip Invitations RLS
CREATE POLICY "Users can view invitations for their trips or sent to their email"
  ON public.trip_invitations
  FOR SELECT
  USING (
    inviter_id = auth.uid()
    OR invitee_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_invitations.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Trip owners and editors can insert invitations"
  ON public.trip_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = trip_invitations.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

-- Group Polls RLS
CREATE POLICY "Authorized trip members can view group polls"
  ON public.group_polls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = group_polls.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Trip members with editor or owner role can create polls"
  ON public.group_polls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = group_polls.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

-- Group Votes RLS
CREATE POLICY "Authorized trip members can view group votes"
  ON public.group_votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = group_votes.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Authorized trip members can cast votes"
  ON public.group_votes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = group_votes.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own votes"
  ON public.group_votes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Expense Participants RLS
CREATE POLICY "Authorized trip members can view expense participants"
  ON public.expense_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = expense_participants.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Trip editors and owners can manage expense participants"
  ON public.expense_participants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = expense_participants.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );
