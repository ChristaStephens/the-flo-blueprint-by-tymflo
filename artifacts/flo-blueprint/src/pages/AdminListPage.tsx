import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/react";
import { Link } from "wouter";

interface AdminLead {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  primaryConstraint: string;
  floProfile: string;
  businessHealthScore: number;
  selectedFocus: string | null;
  paymentStatus: string | null;
  leadStage: string | null;
  debriefBookingDate: string | null;
  debriefSummaryStatus: string | null;
  eventSource: string | null;
  campaign: string | null;
  createdAt: string;
}

const FOCUS_LABELS: Record<string, string> = {
  clarity: "Strategy Clarity",
  qualified_leads: "Qualified Leads",
  save_time: "Save Time",
  implementation: "Implementation",
};

const STAGE_OPTIONS = [
  { value: "", label: "All Leads" },
  { value: "paid_debrief", label: "Paid Debrief" },
  { value: "focus_selected", label: "Focus Selected" },
  { value: "booking_scheduled", label: "Booking Scheduled" },
  { value: "debrief_complete", label: "Debrief Complete" },
];

const SUMMARY_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  finalized: "Finalized",
  sent: "Sent",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminListPage() {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState("");
  const [sortField, setSortField] = useState<keyof AdminLead>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch("/api/admin/leads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { leads: AdminLead[] };
      setLeads(body.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded) fetchLeads();
  }, [isLoaded, fetchLeads]);

  function handleSort(field: keyof AdminLead) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filtered = leads
    .filter((l) => (stageFilter ? l.leadStage === stageFilter : true))
    .filter((l) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.firstName.toLowerCase().includes(q) ||
        l.lastName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  function SortIcon({ field }: { field: keyof AdminLead }) {
    if (sortField !== field) return <span className="text-[#c8c5d4] ml-1">↕</span>;
    return <span className="text-[#463176] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center">
        <p className="font-sans text-sm text-[#6b6680]">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafaf7] flex items-center justify-center">
        <div className="text-center">
          <p className="font-sans text-sm font-medium text-red-600 mb-2">Access Denied</p>
          <p className="font-sans text-sm text-[#6b6680]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e3ee] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-[#F69679] font-medium mb-0.5">
              TymFlo Admin
            </p>
            <h1 className="font-serif text-xl font-bold text-[#1a1625]">
              The Flo Blueprint™ — Lead Management
            </h1>
          </div>
          <div className="text-right">
            <p className="font-sans text-xs text-[#6b6680]">Signed in as</p>
            <p className="font-sans text-sm font-medium text-[#1a1625]">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-[#e5e3ee] px-3 py-2 font-sans text-sm text-[#1a1625] bg-white focus:outline-none focus:border-[#463176] flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            {STAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStageFilter(opt.value)}
                className={`px-3 py-1.5 font-sans text-xs font-medium border transition-colors ${
                  stageFilter === opt.value
                    ? "bg-[#463176] text-white border-[#463176]"
                    : "bg-white text-[#6b6680] border-[#e5e3ee] hover:border-[#463176] hover:text-[#463176]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Leads", value: leads.length },
            {
              label: "Paid Debriefs",
              value: leads.filter((l) => l.paymentStatus === "paid").length,
            },
            {
              label: "Bookings",
              value: leads.filter((l) => l.debriefBookingDate).length,
            },
            {
              label: "Summaries Sent",
              value: leads.filter((l) => l.debriefSummaryStatus === "sent").length,
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-[#e5e3ee] p-4">
              <p className="font-sans text-2xl font-bold text-[#463176]">{stat.value}</p>
              <p className="font-sans text-xs text-[#6b6680] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e5e3ee] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e3ee] bg-[#fafaf7]">
                {(
                  [
                    ["Name & Company", "firstName"],
                    ["Primary Constraint", "primaryConstraint"],
                    ["Focus", "selectedFocus"],
                    ["Payment", "paymentStatus"],
                    ["Booking Date", "debriefBookingDate"],
                    ["Summary Status", "debriefSummaryStatus"],
                    ["Created", "createdAt"],
                  ] as [string, keyof AdminLead][]
                ).map(([label, field]) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className="text-left px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wide text-[#6b6680] cursor-pointer select-none hover:text-[#463176] whitespace-nowrap"
                  >
                    {label}
                    <SortIcon field={field} />
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center px-4 py-12 font-sans text-sm text-[#6b6680]"
                  >
                    No leads found
                  </td>
                </tr>
              )}
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[#f0eef8] hover:bg-[#fafaf7] transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-sans text-sm font-semibold text-[#1a1625]">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="font-sans text-xs text-[#6b6680]">{lead.company}</p>
                    <p className="font-sans text-xs text-[#c8c5d4]">{lead.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-sans text-xs text-[#463176] bg-[#f0eef8] px-2 py-0.5">
                      {lead.primaryConstraint}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-sans text-sm text-[#1a1625]">
                    {lead.selectedFocus
                      ? FOCUS_LABELS[lead.selectedFocus] ?? lead.selectedFocus
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.paymentStatus === "paid" ? (
                      <span className="font-sans text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 border border-green-200">
                        Paid
                      </span>
                    ) : (
                      <span className="font-sans text-xs text-[#6b6680]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-sans text-sm text-[#1a1625] whitespace-nowrap">
                    {formatDate(lead.debriefBookingDate)}
                  </td>
                  <td className="px-4 py-3">
                    {lead.debriefSummaryStatus ? (
                      <span
                        className={`font-sans text-xs font-medium px-2 py-0.5 ${
                          lead.debriefSummaryStatus === "sent"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : lead.debriefSummaryStatus === "finalized"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-[#f0eef8] text-[#463176]"
                        }`}
                      >
                        {SUMMARY_STATUS_LABELS[lead.debriefSummaryStatus] ??
                          lead.debriefSummaryStatus}
                      </span>
                    ) : (
                      <span className="font-sans text-xs text-[#6b6680]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-sans text-xs text-[#6b6680] whitespace-nowrap">
                    {formatDate(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${lead.id}`}>
                      <a className="font-sans text-xs font-medium text-[#463176] hover:underline whitespace-nowrap">
                        View →
                      </a>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="font-sans text-xs text-[#6b6680] mt-4">
          Showing {filtered.length} of {leads.length} leads
        </p>
      </main>
    </div>
  );
}
