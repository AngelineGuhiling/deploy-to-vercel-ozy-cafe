"use client";

import { useEffect, useState } from "react";

interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  check_in: string;
  check_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface UserProfile {
  id: number;
  name: string;
  role: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAttendance();
    }
  }, [user, filterDate]);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {}
  };

  const fetchAttendance = async () => {
    try {
      let url = "/api/attendance";
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      if (params.toString()) url += "?" + params.toString();

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);

        const today = new Date().toISOString().split("T")[0];
        const todayRec = data.find((r: AttendanceRecord) => {
          const checkInDate = new Date(r.check_in).toISOString().split("T")[0];
          return checkInDate === today && !r.check_out;
        });
        setTodayRecord(todayRec || null);
      }
    } catch {
      setMessage("Failed to load attendance");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_in" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setMessageType("success");
        fetchAttendance();
      } else {
        setMessage(data.error);
        setMessageType("error");
      }
    } catch {
      setMessage("Failed to check in");
      setMessageType("error");
    }
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check_out" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setMessageType("success");
        fetchAttendance();
      } else {
        setMessage(data.error);
        setMessageType("error");
      }
    } catch {
      setMessage("Failed to check out");
      setMessageType("error");
    }
    setActionLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this attendance record?")) return;
    try {
      const res = await fetch(`/api/attendance?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage("Record deleted");
        setMessageType("success");
        fetchAttendance();
      } else {
        setMessage(data.error);
        setMessageType("error");
      }
    } catch {
      setMessage("Failed to delete record");
      setMessageType("error");
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDuration = (checkIn: string, checkOut: string | null) => {
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-700";
      case "late": return "bg-yellow-100 text-yellow-700";
      case "absent": return "bg-red-100 text-red-700";
      case "half_day": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-coffee-primary">
        <svg className="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading attendance...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-coffee-dark">Attendance</h2>
        <div className="flex gap-3 items-center">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-coffee-light rounded-lg focus:ring-2 focus:ring-coffee-accent outline-none text-sm"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate("")}
              className="text-sm text-coffee-primary hover:text-coffee-dark transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
          messageType === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {messageType === "success" ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-coffee-light p-6">
        <h3 className="font-bold text-coffee-dark mb-4">Today&apos;s Attendance</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            {todayRecord ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-coffee-primary">Check in:</span>
                  <span className="font-semibold text-coffee-dark">{formatTime(todayRecord.check_in)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(todayRecord.status)}`}>
                    {todayRecord.status}
                  </span>
                </div>
                {todayRecord.check_out ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-coffee-primary">Check out:</span>
                    <span className="font-semibold text-coffee-dark">{formatTime(todayRecord.check_out)}</span>
                    <span className="text-sm text-coffee-primary">
                      ({getDuration(todayRecord.check_in, todayRecord.check_out)})
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-coffee-primary">Not checked out yet</p>
                )}
              </div>
            ) : (
              <p className="text-coffee-primary/60">No attendance recorded today</p>
            )}
          </div>
          <div className="flex gap-3">
            {!todayRecord ? (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Check In
              </button>
            ) : !todayRecord.check_out ? (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Check Out
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-light overflow-hidden">
        <div className="p-4 border-b border-coffee-light">
          <h3 className="font-bold text-coffee-dark">
            {user?.role === "admin" ? "All Staff Attendance" : "My Attendance History"}
          </h3>
        </div>
        {records.length === 0 ? (
          <div className="p-8 text-center text-coffee-primary/50">
            No attendance records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-coffee-cream">
                  {user?.role === "admin" && (
                    <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Staff</th>
                  )}
                  <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Check In</th>
                  <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Check Out</th>
                  <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Duration</th>
                  <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Status</th>
                  {user?.role === "admin" && (
                    <th className="text-left px-4 py-3 font-semibold text-coffee-dark">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-coffee-light hover:bg-coffee-cream/50 transition">
                    {user?.role === "admin" && (
                      <td className="px-4 py-3">
                        <div className="font-medium text-coffee-dark">{record.user_name}</div>
                        <div className="text-xs text-coffee-primary/60 capitalize">{record.user_role}</div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-coffee-dark">{formatDate(record.check_in)}</td>
                    <td className="px-4 py-3 text-coffee-dark font-medium">{formatTime(record.check_in)}</td>
                    <td className="px-4 py-3 text-coffee-dark font-medium">
                      {record.check_out ? formatTime(record.check_out) : <span className="text-coffee-primary/40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-coffee-primary">
                      {getDuration(record.check_in, record.check_out)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    {user?.role === "admin" && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium transition"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
