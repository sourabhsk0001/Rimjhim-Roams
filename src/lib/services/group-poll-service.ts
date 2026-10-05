// ==============================================================================
// Group Voting & Polls Service
// ==============================================================================

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { GroupPoll, GroupPollOption, GroupVote } from "@/types/collaboration";
import { collaborationService } from "./collaboration-service";

// In-memory fallback stores
export const memoryGroupPolls: Map<string, GroupPoll> = new Map();
export const memoryGroupVotes: Map<string, GroupVote> = new Map();

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

export class GroupPollService {
  /**
   * Creates a new group poll for activity/dining/destination decisions.
   * Example options: ["Beach", "Trek", "Museum"]
   */
  async createPoll(
    tripId: string,
    creatorUserId: string,
    title: string,
    optionTitles: string[],
    description?: string,
    deadline?: string
  ): Promise<{ success: boolean; poll?: GroupPoll; error?: string }> {
    const role = await collaborationService.getUserTripRole(tripId, creatorUserId);
    if (!role || (role !== "owner" && role !== "editor")) {
      return { success: false, error: "Only trip owners or editors can create group polls." };
    }

    if (!title || title.trim().length === 0) {
      return { success: false, error: "Poll title is required." };
    }

    const cleanOptions = (optionTitles || [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (cleanOptions.length < 2) {
      return { success: false, error: "A poll must have at least 2 options (e.g. Beach, Trek, Museum)." };
    }

    const pollId = `poll-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const structuredOptions: GroupPollOption[] = cleanOptions.map((optTitle, index) => ({
      id: `opt-${index + 1}-${Math.random().toString(36).substring(2, 6)}`,
      title: optTitle,
      votes_count: 0,
      voter_user_ids: [],
    }));

    const now = new Date().toISOString();

    if (!isSupabaseLive()) {
      const poll: GroupPoll = {
        id: pollId,
        trip_id: tripId,
        creator_id: creatorUserId,
        title: title.trim(),
        description: description?.trim() || null,
        options: structuredOptions,
        status: "active",
        deadline: deadline || null,
        total_votes: 0,
        winning_option: null,
        created_at: now,
      };
      memoryGroupPolls.set(pollId, poll);
      return { success: true, poll };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase
        .from("group_polls")
        .insert({
          trip_id: tripId,
          creator_id: creatorUserId,
          title: title.trim(),
          description: description?.trim() || null,
          options: structuredOptions as any,
          status: "active",
          deadline: deadline || null,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      return {
        success: true,
        poll: {
          id: data.id,
          trip_id: data.trip_id,
          creator_id: data.creator_id,
          title: data.title,
          description: data.description,
          options: (data.options as any) || [],
          status: data.status as any,
          deadline: data.deadline,
          total_votes: 0,
          winning_option: null,
          created_at: data.created_at,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create poll",
      };
    }
  }

  /**
   * Casts or switches a member's vote in an active poll.
   */
  async castVote(
    tripId: string,
    pollId: string,
    userId: string,
    optionId: string
  ): Promise<{ success: boolean; poll?: GroupPoll; error?: string }> {
    const isMember = await collaborationService.isUserTripMember(tripId, userId);
    if (!isMember) {
      return { success: false, error: "Only authorized trip members can cast votes." };
    }

    if (!isSupabaseLive()) {
      const poll = memoryGroupPolls.get(pollId);
      if (!poll || poll.trip_id !== tripId) {
        return { success: false, error: "Poll not found." };
      }
      if (poll.status !== "active") {
        return { success: false, error: "This poll is closed for voting." };
      }

      const optionExists = poll.options.some((o) => o.id === optionId);
      if (!optionExists) {
        return { success: false, error: "Invalid option selected." };
      }

      // Record in memoryGroupVotes
      const voteKey = `${pollId}-${userId}`;
      const vote: GroupVote = {
        id: `vote-${Date.now()}`,
        poll_id: pollId,
        trip_id: tripId,
        user_id: userId,
        option_id: optionId,
        created_at: new Date().toISOString(),
      };
      memoryGroupVotes.set(voteKey, vote);

      // Recompute tallies
      const updatedPoll = this.tallyMemoryPoll(poll, userId);
      return { success: true, poll: updatedPoll };
    }

    try {
      const supabase = createServerSupabase() as any;

      // Check poll status
      const { data: pollData, error: pollErr } = await supabase
        .from("group_polls")
        .select("*")
        .eq("id", pollId)
        .eq("trip_id", tripId)
        .single();

      if (pollErr || !pollData) {
        return { success: false, error: "Poll not found." };
      }
      if (pollData.status !== "active") {
        return { success: false, error: "This poll is closed." };
      }

      // Upsert vote
      const { error: voteErr } = await supabase
        .from("group_votes")
        .upsert(
          {
            poll_id: pollId,
            trip_id: tripId,
            user_id: userId,
            option_id: optionId,
          },
          { onConflict: "poll_id,user_id" }
        );

      if (voteErr) return { success: false, error: voteErr.message };

      const pollsRes = await this.getPolls(tripId, userId);
      const updated = pollsRes.polls.find((p) => p.id === pollId);
      return { success: true, poll: updated };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to cast vote",
      };
    }
  }

  /**
   * Retrieves all polls for a trip with hydrated live vote counts and winner.
   */
  async getPolls(
    tripId: string,
    callerUserId: string
  ): Promise<{ success: boolean; polls: GroupPoll[]; error?: string }> {
    const isMember = await collaborationService.isUserTripMember(tripId, callerUserId);
    if (!isMember) {
      return { success: false, polls: [], error: "Unauthorized access to group polls." };
    }

    if (!isSupabaseLive()) {
      const tripPolls = Array.from(memoryGroupPolls.values())
        .filter((p) => p.trip_id === tripId)
        .map((p) => this.tallyMemoryPoll(p, callerUserId))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      return { success: true, polls: tripPolls };
    }

    try {
      const supabase = createServerSupabase() as any;

      // 1. Fetch polls
      const { data: pollsData, error: pErr } = await supabase
        .from("group_polls")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (pErr) return { success: false, polls: [], error: pErr.message };

      // 2. Fetch all votes for this trip
      const { data: votesData, error: vErr } = await supabase
        .from("group_votes")
        .select("*")
        .eq("trip_id", tripId);

      if (vErr) return { success: false, polls: [], error: vErr.message };

      const votesByPoll = new Map<string, GroupVote[]>();
      for (const v of votesData || []) {
        if (!votesByPoll.has(v.poll_id)) {
          votesByPoll.set(v.poll_id, []);
        }
        votesByPoll.get(v.poll_id)!.push({
          id: v.id,
          poll_id: v.poll_id,
          trip_id: v.trip_id,
          user_id: v.user_id,
          option_id: v.option_id,
          created_at: v.created_at,
        });
      }

      const result: GroupPoll[] = (pollsData || []).map((raw: any) => {
        const votes = votesByPoll.get(raw.id) || [];
        const options: GroupPollOption[] = ((raw.options as any) || []).map((opt: any) => {
          const matchingVotes = votes.filter((v) => v.option_id === opt.id);
          return {
            id: opt.id,
            title: opt.title,
            votes_count: matchingVotes.length,
            voter_user_ids: matchingVotes.map((v) => v.user_id),
          };
        });

        const totalVotes = votes.length;
        const userVote = votes.find((v) => v.user_id === callerUserId);

        let winningOption: GroupPollOption | null = null;
        if (totalVotes > 0) {
          winningOption = [...options].sort((a, b) => b.votes_count - a.votes_count)[0];
        }

        return {
          id: raw.id,
          trip_id: raw.trip_id,
          creator_id: raw.creator_id,
          title: raw.title,
          description: raw.description,
          options,
          status: raw.status as any,
          deadline: raw.deadline,
          total_votes: totalVotes,
          winning_option: winningOption,
          user_voted_option_id: userVote?.option_id || null,
          created_at: raw.created_at,
        };
      });

      return { success: true, polls: result };
    } catch (err: unknown) {
      return {
        success: false,
        polls: [],
        error: err instanceof Error ? err.message : "Failed to load polls",
      };
    }
  }

  /**
   * Closes a poll.
   */
  async closePoll(
    tripId: string,
    pollId: string,
    callerUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const role = await collaborationService.getUserTripRole(tripId, callerUserId);
    if (!role) return { success: false, error: "Unauthorized." };

    if (!isSupabaseLive()) {
      const poll = memoryGroupPolls.get(pollId);
      if (!poll || poll.trip_id !== tripId) return { success: false, error: "Poll not found." };
      if (poll.creator_id !== callerUserId && role !== "owner") {
        return { success: false, error: "Only the poll creator or trip owner can close it." };
      }
      poll.status = "closed";
      return { success: true };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { error } = await supabase
        .from("group_polls")
        .update({ status: "closed" })
        .eq("id", pollId)
        .eq("trip_id", tripId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to close poll",
      };
    }
  }

  private tallyMemoryPoll(poll: GroupPoll, callerUserId: string): GroupPoll {
    const pollVotes = Array.from(memoryGroupVotes.values()).filter(
      (v) => v.poll_id === poll.id
    );

    const talliedOptions: GroupPollOption[] = poll.options.map((opt) => {
      const matchingVotes = pollVotes.filter((v) => v.option_id === opt.id);
      return {
        ...opt,
        votes_count: matchingVotes.length,
        voter_user_ids: matchingVotes.map((v) => v.user_id),
      };
    });

    const totalVotes = pollVotes.length;
    const userVote = pollVotes.find((v) => v.user_id === callerUserId);

    let winningOption: GroupPollOption | null = null;
    if (totalVotes > 0) {
      winningOption = [...talliedOptions].sort((a, b) => b.votes_count - a.votes_count)[0];
    }

    return {
      ...poll,
      options: talliedOptions,
      total_votes: totalVotes,
      winning_option: winningOption,
      user_voted_option_id: userVote?.option_id || null,
    };
  }
}

export const groupPollService = new GroupPollService();
