import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const LEAVE_COLORS: Record<string, string> = {
  annual: "bg-blue-500",
  sick: "bg-red-400",
  personal: "bg-purple-400",
  other: "bg-slate-400",
};

const STATUS_OPACITY: Record<string, string> = {
  approved: "opacity-100",
  pending: "opacity-50",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type LeaveEntry = {
  id: string;
  userId: string;
  userName: string;
  department: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: string;
};

type HolidayEntry = {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
};

function isoToDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function LeaveCalendarPage() {
  const { authFetch } = useAuth();
  const { roleName } = useRole();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const { data, isLoading } = useQuery({
    queryKey: ["leave-calendar", monthKey],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/leave/calendar?month=${monthKey}`);
      const json = await res.json();
      return json.data as { leaves: LeaveEntry[]; holidays: HolidayEntry[] };
    },
  });

  const leaves = data?.leaves ?? [];
  const holidays = data?.holidays ?? [];

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const getLeavesForDay = (day: number) => {
    const d = new Date(year, month - 1, day);
    return leaves.filter((l) => {
      const start = isoToDate(l.startDate);
      const end = isoToDate(l.endDate);
      return d >= start && d <= end;
    });
  };

  const getHolidayForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.find((h) => {
      if (h.isRecurring) {
        return h.date.slice(5, 10) === dateStr.slice(5, 10);
      }
      return h.date.slice(0, 10) === dateStr;
    });
  };

  const isToday = (day: number) => {
    return day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
  };

  const isWeekend = (cellIndex: number) => cellIndex % 7 >= 5;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {roleName === "admin" || roleName === "manager" ? "Team Leave Calendar" : "My Leave Calendar"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium w-36 text-center">{MONTHS[month - 1]} {year}</span>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(LEAVE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-sm", color)} />
            {type}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-100 border border-amber-300" />
          holiday
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-300 opacity-50" />
          pending
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="grid grid-cols-7 border-b">
          {DAYS.map((d) => (
            <div key={d} className={cn("py-2 text-center text-xs font-semibold text-slate-500", d === "Sat" || d === "Sun" ? "text-slate-300" : "")}>
              {d}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-400 text-sm">Loading…</div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const holiday = day ? getHolidayForDay(day) : null;
              const dayLeaves = day ? getLeavesForDay(day) : [];
              const weekend = isWeekend(i);

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[80px] border-b border-r p-1 last:border-r-0",
                    !day && "bg-slate-50",
                    weekend && day && "bg-slate-50/60",
                    holiday && "bg-amber-50",
                    day && isToday(day) && "ring-2 ring-inset ring-blue-400"
                  )}
                >
                  {day && (
                    <>
                      <div className={cn(
                        "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday(day) ? "bg-blue-600 text-white" : "text-slate-600"
                      )}>
                        {day}
                      </div>
                      {holiday && (
                        <div className="mb-0.5 truncate rounded bg-amber-100 px-1 text-[10px] text-amber-700 border border-amber-200">
                          🌴 {holiday.name}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        {dayLeaves.slice(0, 3).map((l) => (
                          <div
                            key={`${l.id}-${i}`}
                            className={cn(
                              "truncate rounded px-1 text-[10px] text-white",
                              LEAVE_COLORS[l.leaveType] ?? "bg-slate-400",
                              STATUS_OPACITY[l.status]
                            )}
                            title={`${l.userName} — ${l.leaveType} (${l.status})`}
                          >
                            {l.userName.split(" ")[0]}
                          </div>
                        ))}
                        {dayLeaves.length > 3 && (
                          <div className="text-[10px] text-slate-400 px-1">+{dayLeaves.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {leaves.length > 0 && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">On Leave This Month</h2>
          <div className="space-y-2">
            {leaves.map((l) => (
              <div key={l.id} className="flex items-center gap-3 text-sm">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", LEAVE_COLORS[l.leaveType] ?? "bg-slate-400")} />
                <span className="font-medium">{l.userName}</span>
                {l.department && <span className="text-slate-400 text-xs">{l.department}</span>}
                <span className="text-slate-500">{l.startDate} → {l.endDate}</span>
                <Badge variant={l.status === "approved" ? "default" : "secondary"} className="text-[10px] py-0">
                  {l.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
