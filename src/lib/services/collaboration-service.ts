// ==============================================================================
// Phase 12: Trip Collaboration, Membership & Invitations Service
// ==============================================================================

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  TripMember,
  TripMemberRole,
  TripInvitation,
} from "@/types/collaboration";
import { getTripById } from "@/lib/services/trip-service";

// In-memory fallback stores for test and offline environments
export const memoryTripMembers: Map<string, TripMember> = new Map();
export const memoryTripInvitations: Map<string, TripInvitation> = new Map();

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

export class CollaborationService {
  /**
   * Checks if a user is authorized for a trip (either as trip creator/owner or member).
   */
  async isUserTripMember(tripId: string, userId: string): Promise<boolean> {
    const role = await this.getUserTripRole(tripId, userId);
    return role !== null;
  }

  /**
   * Returns the role of a user in a trip ('owner', 'editor', 'viewer', or null if unauthorized).
   */
  async getUserTripRole(tripId: string, userId: string): Promise<TripMemberRole | null> {
    const { trip } = await getTripById(tripId, userId);
    if (trip && trip.user_id === userId) {
      return "owner";
    }

    if (!isSupabaseLive()) {
      for (const member of Array.from(memoryTripMembers.values())) {
        if (member.trip_id === tripId && member.user_id === userId) {
          return member.role;
        }
      }
      return null;
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data } = await supabase
        .from("trip_members")
        .select("role")
        .eq("trip_id", tripId)
        .eq("user_id", userId)
        .maybeSingle();

      return (data?.role as TripMemberRole) || null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves all members of a trip. Requires caller to be an authorized member.
   */
  async getTripMembers(
    tripId: string,
    callerUserId: string
  ): Promise<{ success: boolean; members: TripMember[]; error?: string }> {
    const callerRole = await this.getUserTripRole(tripId, callerUserId);
    if (!callerRole) {
      return { success: false, members: [], error: "Unauthorized access to trip members." };
    }

    if (!isSupabaseLive()) {
      const members: TripMember[] = [];
      const { trip } = await getTripById(tripId, callerUserId);
      if (trip) {
        // Ensure owner is included in roster
        const ownerExists = Array.from(memoryTripMembers.values()).some(
          (m) => m.trip_id === tripId && m.user_id === trip.user_id
        );
        if (!ownerExists) {
          members.push({
            id: `member-${trip.id}-${trip.user_id}`,
            trip_id: tripId,
            user_id: trip.user_id,
            role: "owner",
            full_name: "Trip Creator",
            email: "creator@example.com",
            created_at: trip.created_at,
          });
        }
      }

      for (const m of Array.from(memoryTripMembers.values())) {
        if (m.trip_id === tripId) {
          members.push(m);
        }
      }

      return { success: true, members };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase
        .from("trip_members")
        .select(`
          id,
          trip_id,
          user_id,
          role,
          created_at,
          profiles:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });

      if (error) {
        return { success: false, members: [], error: error.message };
      }

      const formatted: TripMember[] = (data || []).map((row: any) => ({
        id: row.id,
        trip_id: row.trip_id,
        user_id: row.user_id,
        role: row.role as TripMemberRole,
        full_name: row.profiles?.full_name || undefined,
        email: row.profiles?.email || undefined,
        avatar_url: row.profiles?.avatar_url || undefined,
        created_at: row.created_at,
      }));

      return { success: true, members: formatted };
    } catch (err: unknown) {
      return {
        success: false,
        members: [],
        error: err instanceof Error ? err.message : "Failed to load members",
      };
    }
  }

  /**
   * Adds or updates a member directly (used by owners/editors).
   */
  async addTripMember(
    tripId: string,
    callerUserId: string,
    targetUserId: string,
    role: TripMemberRole = "editor",
    metadata?: { full_name?: string; email?: string }
  ): Promise<{ success: boolean; member?: TripMember; error?: string }> {
    const callerRole = await this.getUserTripRole(tripId, callerUserId);
    if (!callerRole || (callerRole !== "owner" && callerRole !== "editor")) {
      return { success: false, error: "Only trip owners or editors can add members." };
    }

    if (!isSupabaseLive()) {
      const existingKey = Array.from(memoryTripMembers.entries()).find(
        ([_, m]) => m.trip_id === tripId && m.user_id === targetUserId
      );

      const id = existingKey ? existingKey[0] : `member-${tripId}-${targetUserId}`;
      const member: TripMember = {
        id,
        trip_id: tripId,
        user_id: targetUserId,
        role,
        full_name: metadata?.full_name || `Member ${targetUserId.substring(0, 6)}`,
        email: metadata?.email || `${targetUserId}@tripwise.com`,
        created_at: new Date().toISOString(),
      };
      memoryTripMembers.set(id, member);
      return { success: true, member };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase
        .from("trip_members")
        .upsert(
          {
            trip_id: tripId,
            user_id: targetUserId,
            role,
          },
          { onConflict: "trip_id,user_id" }
        )
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        member: {
          id: data.id,
          trip_id: data.trip_id,
          user_id: data.user_id,
          role: data.role as TripMemberRole,
          created_at: data.created_at,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to add member",
      };
    }
  }

  /**
   * Updates an existing member's role. Only owners can change roles.
   */
  async updateTripMemberRole(
    tripId: string,
    callerUserId: string,
    targetUserId: string,
    newRole: TripMemberRole
  ): Promise<{ success: boolean; error?: string }> {
    const callerRole = await this.getUserTripRole(tripId, callerUserId);
    if (callerRole !== "owner") {
      return { success: false, error: "Only the trip owner can update member roles." };
    }

    if (!isSupabaseLive()) {
      const entry = Array.from(memoryTripMembers.values()).find(
        (m) => m.trip_id === tripId && m.user_id === targetUserId
      );
      if (!entry) return { success: false, error: "Member not found." };
      entry.role = newRole;
      return { success: true };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { error } = await supabase
        .from("trip_members")
        .update({ role: newRole })
        .eq("trip_id", tripId)
        .eq("user_id", targetUserId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update member role",
      };
    }
  }

  /**
   * Removes a member from a trip.
   */
  async removeTripMember(
    tripId: string,
    callerUserId: string,
    targetUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const callerRole = await this.getUserTripRole(tripId, callerUserId);
    if (!callerRole) return { success: false, error: "Unauthorized." };

    // Members can remove themselves, or owners can remove anyone
    if (callerUserId !== targetUserId && callerRole !== "owner") {
      return { success: false, error: "Only the owner can remove other members." };
    }

    if (!isSupabaseLive()) {
      for (const [key, m] of Array.from(memoryTripMembers.entries())) {
        if (m.trip_id === tripId && m.user_id === targetUserId) {
          memoryTripMembers.delete(key);
          return { success: true };
        }
      }
      return { success: false, error: "Member not found." };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { error } = await supabase
        .from("trip_members")
        .delete()
        .eq("trip_id", tripId)
        .eq("user_id", targetUserId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to remove member",
      };
    }
  }

  /**
   * Creates an invitation for an email address with a secure token.
   */
  async createInvitation(
    tripId: string,
    callerUserId: string,
    inviteeEmail: string,
    role: TripMemberRole = "editor"
  ): Promise<{ success: boolean; invitation?: TripInvitation; error?: string }> {
    const callerRole = await this.getUserTripRole(tripId, callerUserId);
    if (!callerRole || (callerRole !== "owner" && callerRole !== "editor")) {
      return { success: false, error: "Only trip owners or editors can invite collaborators." };
    }

    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    if (!isSupabaseLive()) {
      const id = `inv-id-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const invitation: TripInvitation = {
        id,
        trip_id: tripId,
        inviter_id: callerUserId,
        invitee_email: inviteeEmail.trim().toLowerCase(),
        role,
        status: "pending",
        token,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };
      memoryTripInvitations.set(id, invitation);
      return { success: true, invitation };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase
        .from("trip_invitations")
        .insert({
          trip_id: tripId,
          inviter_id: callerUserId,
          invitee_email: inviteeEmail.trim().toLowerCase(),
          role,
          status: "pending",
          token,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };

      return {
        success: true,
        invitation: {
          id: data.id,
          trip_id: data.trip_id,
          inviter_id: data.inviter_id,
          invitee_email: data.invitee_email,
          invitee_user_id: data.invitee_user_id,
          role: data.role as TripMemberRole,
          status: data.status as any,
          token: data.token,
          expires_at: data.expires_at,
          created_at: data.created_at,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create invitation",
      };
    }
  }

  /**
   * Lists pending invitations for a trip.
   */
  async getTripInvitations(
    tripId: string,
    callerUserId: string
  ): Promise<{ success: boolean; invitations: TripInvitation[]; error?: string }> {
    const callerRole = await this.getUserTripRole(tripId, callerUserId);
    if (!callerRole) {
      return { success: false, invitations: [], error: "Unauthorized." };
    }

    if (!isSupabaseLive()) {
      const invitations = Array.from(memoryTripInvitations.values()).filter(
        (i) => i.trip_id === tripId && i.status === "pending"
      );
      return { success: true, invitations };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase
        .from("trip_invitations")
        .select("*")
        .eq("trip_id", tripId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) return { success: false, invitations: [], error: error.message };

      return {
        success: true,
        invitations: (data || []).map((row: any) => ({
          id: row.id,
          trip_id: row.trip_id,
          inviter_id: row.inviter_id,
          invitee_email: row.invitee_email,
          invitee_user_id: row.invitee_user_id,
          role: row.role as TripMemberRole,
          status: row.status as any,
          token: row.token,
          expires_at: row.expires_at,
          created_at: row.created_at,
        })),
      };
    } catch (err: unknown) {
      return {
        success: false,
        invitations: [],
        error: err instanceof Error ? err.message : "Failed to fetch invitations",
      };
    }
  }

  /**
   * Accepts an invitation using its secure token.
   */
  async acceptInvitation(
    token: string,
    userId: string,
    userEmail?: string
  ): Promise<{ success: boolean; tripId?: string; error?: string }> {
    if (!isSupabaseLive()) {
      const inv = Array.from(memoryTripInvitations.values()).find(
        (i) => i.token === token && i.status === "pending"
      );
      if (!inv) {
        return { success: false, error: "Invalid or expired invitation token." };
      }

      if (new Date(inv.expires_at) < new Date()) {
        inv.status = "declined";
        return { success: false, error: "Invitation has expired." };
      }

      inv.status = "accepted";
      inv.invitee_user_id = userId;

      // Add as member
      const memberId = `member-${inv.trip_id}-${userId}`;
      memoryTripMembers.set(memberId, {
        id: memberId,
        trip_id: inv.trip_id,
        user_id: userId,
        role: inv.role,
        email: userEmail || inv.invitee_email,
        full_name: `Member ${userId.substring(0, 6)}`,
        created_at: new Date().toISOString(),
      });

      return { success: true, tripId: inv.trip_id };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data: inv, error: findErr } = await supabase
        .from("trip_invitations")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (findErr || !inv) {
        return { success: false, error: "Invalid or expired invitation token." };
      }

      if (new Date(inv.expires_at) < new Date()) {
        return { success: false, error: "Invitation has expired." };
      }

      // Add to trip_members
      await supabase.from("trip_members").upsert(
        {
          trip_id: inv.trip_id,
          user_id: userId,
          role: inv.role,
        },
        { onConflict: "trip_id,user_id" }
      );

      // Mark invitation accepted
      await supabase
        .from("trip_invitations")
        .update({ status: "accepted", invitee_user_id: userId })
        .eq("id", inv.id);

      return { success: true, tripId: inv.trip_id };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to accept invitation",
      };
    }
  }
}

export const collaborationService = new CollaborationService();
