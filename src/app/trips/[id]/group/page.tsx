"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Vote,
  UserPlus,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  Trophy,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Share2,
  Calendar,
  Wallet,
  CloudSun,
  Bot,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TripWorkspaceNav } from "@/components/travel/trip-workspace-nav";
import { useToast } from "@/components/ui/toast";
import { TripMember, TripInvitation, GroupPoll, TripMemberRole } from "@/types/collaboration";

export default function TripGroupPage() {
  const params = useParams();
  const tripId = params.id as string;
  const { toast } = useToast();

  const [members, setMembers] = useState<TripMember[]>([]);
  const [invitations, setInvitations] = useState<TripInvitation[]>([]);
  const [polls, setPolls] = useState<GroupPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TripMemberRole>("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  // Create Poll modal state
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDesc, setPollDesc] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["Beach", "Trek", "Museum"]);
  const [creatingPoll, setCreatingPoll] = useState(false);

  // Voting state tracker
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  async function loadGroupData() {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, pollsRes] = await Promise.all([
        fetch(`/api/trips/${tripId}/members`),
        fetch(`/api/trips/${tripId}/polls`),
      ]);

      const membersData = await membersRes.json();
      const pollsData = await pollsRes.json();

      if (!membersRes.ok) throw new Error(membersData.error || "Failed to load members");
      if (!pollsRes.ok) throw new Error(pollsData.error || "Failed to load polls");

      setMembers(membersData.members || []);
      setInvitations(membersData.invitations || []);
      setPolls(pollsData.polls || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load group collaboration data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tripId) {
      loadGroupData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    setInviteSuccessMsg(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite member");

      setInviteSuccessMsg(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
      await loadGroupData();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    if (!pollTitle || pollOptions.filter((o) => o.trim().length > 0).length < 2) return;

    setCreatingPoll(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pollTitle,
          description: pollDesc,
          options: pollOptions.filter((o) => o.trim().length > 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create poll");

      setShowPollModal(false);
      setPollTitle("");
      setPollDesc("");
      setPollOptions(["Beach", "Trek", "Museum"]);
      await loadGroupData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create poll");
    } finally {
      setCreatingPoll(false);
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    setVotingPollId(pollId);
    try {
      const res = await fetch(`/api/trips/${tripId}/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");

      // Update poll in local state
      setPolls((prev) => prev.map((p) => (p.id === pollId ? data.poll : p)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record vote");
    } finally {
      setVotingPollId(null);
    }
  }

  const getRoleBadge = (role: TripMemberRole) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-300">Owner</Badge>;
      case "editor":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-300">Editor</Badge>;
      case "viewer":
        return <Badge className="bg-slate-500/10 text-slate-600 border-slate-300">Viewer</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-rise">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 text-xs text-[hsl(215,25%,32%)] mb-1">
              <Link
                href={`/trips/${tripId}`}
                className="inline-flex items-center gap-1 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Trip Details
              </Link>
              <span>•</span>
              <Link
                href={`/trips/${tripId}/expenses`}
                className="inline-flex items-center gap-1 text-slate-700 hover:text-black font-medium"
              >
                <Wallet className="w-3.5 h-3.5" /> Split & Expenses
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-instrument text-4xl sm:text-5xl font-normal tracking-[-1.5px] text-[#0f172a] leading-none">
                Trip Collaboration & Group Voting
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Collaboration
              </span>
            </div>
            <p className="text-[17px] text-[hsl(215,25%,32%)] font-normal mt-1 leading-relaxed">
              Plan together seamlessly: invite members, assign roles, cast group votes, and decide itineraries collectively.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs sm:text-sm font-medium shadow-xs hover:scale-[1.03] active:scale-[0.98] transition-transform"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite Member
            </button>
            <button
              type="button"
              onClick={() => setShowPollModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-900 shadow-xs hover:bg-slate-50 hover:scale-[1.03] transition-all"
            >
              <Vote className="w-3.5 h-3.5" /> Create Poll
            </button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Unified Module Nav */}
        <TripWorkspaceNav tripId={tripId} />

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm text-muted-foreground">Loading collaborative workspace...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-indigo-50/40 border-indigo-100 dark:bg-indigo-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{members.length}</div>
                    <div className="text-xs text-muted-foreground">Members</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50/40 border-purple-100 dark:bg-purple-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Vote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{polls.length}</div>
                    <div className="text-xs text-muted-foreground">Active Polls</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {polls.reduce((sum, p) => sum + p.total_votes, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Votes</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50/40 border-amber-100 dark:bg-amber-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{invitations.length}</div>
                    <div className="text-xs text-muted-foreground">Pending Invites</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 1: Trip Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Trip Members & Permissions</h2>
                  <p className="text-xs text-muted-foreground">
                    Collaborators who can view, plan, and vote on this journey.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <Card key={member.id} className="shadow-xs hover:border-indigo-200 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {(member.full_name || member.email || "U").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">
                            {member.full_name || "Trip Collaborator"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {member.email || `User ${member.user_id.substring(0, 8)}`}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">{getRoleBadge(member.role)}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pending Invitations list if any */}
              {invitations.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Pending Invitations</h3>
                  <div className="flex flex-wrap gap-2">
                    {invitations.map((inv) => (
                      <Badge
                        key={inv.id}
                        variant="outline"
                        className="px-3 py-1.5 gap-2 text-xs border-amber-200 bg-amber-50/50 text-amber-800"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-600" />
                        <span>{inv.invitee_email}</span>
                        <span className="text-[10px] uppercase font-bold text-amber-600">({inv.role})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Group Polls & Decision Making */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Vote className="w-5 h-5 text-indigo-600" /> Group Decisions & Voting
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Create polls for activities, dining, or route choices and vote collectively.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowPollModal(true)}
                  className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-3.5 h-3.5" /> New Poll
                </Button>
              </div>

              {polls.length === 0 ? (
                <Card className="border-dashed p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Vote className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-base">No active polls yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Want to decide between the beach, a mountain trek, or museum visits? Create a poll and let everyone vote!
                  </p>
                  <Button size="sm" onClick={() => setShowPollModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create First Poll
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {polls.map((poll) => {
                    const isVotingThis = votingPollId === poll.id;
                    return (
                      <Card key={poll.id} className="shadow-xs flex flex-col justify-between">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-base font-bold">{poll.title}</CardTitle>
                              {poll.description && (
                                <CardDescription className="text-xs mt-1">
                                  {poll.description}
                                </CardDescription>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                poll.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]"
                                  : "bg-slate-100 text-slate-600 text-[10px]"
                              }
                            >
                              {poll.status === "active" ? "Live Voting" : "Closed"}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3 pb-4">
                          {poll.options.map((opt) => {
                            const isUserChoice = poll.user_voted_option_id === opt.id;
                            const percentage =
                              poll.total_votes > 0
                                ? Math.round((opt.votes_count / poll.total_votes) * 100)
                                : 0;
                            const isLeading =
                              poll.winning_option &&
                              poll.winning_option.id === opt.id &&
                              opt.votes_count > 0;

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-lg border transition-all ${
                                  isUserChoice
                                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                                    : "border-border hover:border-muted-foreground/30"
                                }`}
                              >
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                  <div className="flex items-center gap-2 font-medium">
                                    {isLeading && (
                                      <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                                    )}
                                    <span>{opt.title}</span>
                                    {isUserChoice && (
                                      <span className="text-[11px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
                                        Your Vote
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-semibold">
                                    {opt.votes_count} {opt.votes_count === 1 ? "vote" : "votes"} ({percentage}%)
                                  </div>
                                </div>

                                {/* Vote bar */}
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      isUserChoice ? "bg-indigo-600" : isLeading ? "bg-amber-500" : "bg-primary/50"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>

                                <Button
                                  size="sm"
                                  variant={isUserChoice ? "default" : "outline"}
                                  disabled={isVotingThis || poll.status === "closed"}
                                  onClick={() => handleVote(poll.id, opt.id)}
                                  className={`w-full text-xs h-7 ${
                                    isUserChoice
                                      ? "bg-indigo-600 hover:bg-indigo-700"
                                      : "hover:border-indigo-400"
                                  }`}
                                >
                                  {isUserChoice ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Voted
                                    </>
                                  ) : (
                                    "Vote for this"
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </CardContent>

                        <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between border-t py-2.5">
                          <div>Total Votes: <span className="font-semibold text-foreground">{poll.total_votes}</span></div>
                          {poll.winning_option && poll.total_votes > 0 && (
                            <div className="flex items-center gap-1 text-amber-600 font-medium">
                              <Trophy className="w-3.5 h-3.5" />
                              Leading: {poll.winning_option.title}
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" /> Invite Collaborator
                </CardTitle>
                <Button size="icon" variant="ghost" onClick={() => setShowInviteModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Invite family or travel companions to view or edit this itinerary.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSendInvite}>
              <CardContent className="space-y-4">
                {inviteSuccessMsg && (
                  <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <AlertDescription>{inviteSuccessMsg}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="traveler@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Member Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteRole("editor")}
                      className={`p-3 text-left border rounded-md text-xs transition-colors ${
                        inviteRole === "editor"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <div className="font-bold">Editor</div>
                      <div className="text-[11px] text-muted-foreground">Can edit schedule, vote & add expenses</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole("viewer")}
                      className={`p-3 text-left border rounded-md text-xs transition-colors ${
                        inviteRole === "viewer"
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <div className="font-bold">Viewer</div>
                      <div className="text-[11px] text-muted-foreground">Can view schedule & vote on polls</div>
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={inviting || !inviteEmail} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Mail className="w-3.5 h-3.5 mr-1" />}
                  Send Invitation
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Create Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Vote className="w-5 h-5 text-indigo-600" /> Create Group Poll
                </CardTitle>
                <Button size="icon" variant="ghost" onClick={() => setShowPollModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Ask your companions to vote on activities, places, or dining options.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreatePoll}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Poll Question / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. What activity should we do on Day 2 afternoon?"
                    value={pollTitle}
                    onChange={(e) => setPollTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Free time slot between 3 PM and 6 PM"
                    value={pollDesc}
                    onChange={(e) => setPollDesc(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Options (Min 2)</label>
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...pollOptions];
                            updated[idx] = e.target.value;
                            setPollOptions(updated);
                          }}
                          className="flex-1 px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        {pollOptions.length > 2 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              const updated = pollOptions.filter((_, i) => i !== idx);
                              setPollOptions(updated);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPollModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creatingPoll || !pollTitle || pollOptions.filter((o) => o.trim().length > 0).length < 2}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {creatingPoll ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Vote className="w-3.5 h-3.5 mr-1" />}
                  Launch Poll
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
