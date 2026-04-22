const { ApplicationStatuses } = require("../models/Application");
const { Application } = require("../models/Application");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function summary(req, res) {
  const userId = req.user.userId;

  const statusCountsAgg = await Application.aggregate([
    { $match: { userId } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const countsByStatus = Object.fromEntries(ApplicationStatuses.map((s) => [s, 0]));
  for (const row of statusCountsAgg) countsByStatus[row._id] = row.count;

  const today = startOfDay(new Date());
  const days = 28;
  const from = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  const timeseriesAgg = await Application.aggregate([
    { $match: { userId, appliedDate: { $gte: from } } },
    {
      $group: {
        _id: {
          y: { $year: "$appliedDate" },
          m: { $month: "$appliedDate" },
          d: { $dayOfMonth: "$appliedDate" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const byDayKey = {};
  for (const row of timeseriesAgg) {
    const k = `${row._id.y}-${String(row._id.m).padStart(2, "0")}-${String(row._id.d).padStart(2, "0")}`;
    byDayKey[k] = row.count;
  }

  const applicationsLast28Days = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    applicationsLast28Days.push({ date: k, count: byDayKey[k] || 0 });
  }

  res.json({
    data: {
      countsByStatus,
      applicationsLast28Days,
    },
  });
}

module.exports = { summary };

