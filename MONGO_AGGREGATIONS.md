# MongoDB Aggregation Pipelines

These are the exact production MongoDB aggregation pipelines to calculate the stats displayed on your Aether Study dashboard.

---

### 1. Total Study Time
Calculates the sum of all study session minutes for a specific user.

```javascript
db.study_sessions.aggregate([
  { 
    $match: { 
      userId: ObjectId("USER_ID_HERE"),
      type: "study" 
    } 
  },
  { 
    $group: { 
      _id: "$userId", 
      totalMinutes: { $sum: "$durationMinutes" } 
    } 
  }
]);
```

---

### 2. Weekly Study Data (Last 7 Days Grouped by Day)
Calculates study minutes per day for the last 7 days, starting from Sunday.

```javascript
db.study_sessions.aggregate([
  {
    $match: {
      userId: ObjectId("USER_ID_HERE"),
      startTime: { $gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())) } // Start of current week (Sunday)
    }
  },
  {
    $project: {
      dayOfWeek: { $dayOfWeek: "$startTime" }, // 1 = Sunday, 7 = Saturday
      durationMinutes: 1
    }
  },
  {
    $group: {
      _id: "$dayOfWeek",
      minutes: { $sum: "$durationMinutes" }
    }
  },
  {
    $project: {
      day: {
        $let: {
          vars: {
            days: ["", "SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
          },
          in: { $arrayElemAt: ["$$days", "$_id"] }
        }
      },
      minutes: 1,
      _id: 0
    }
  },
  {
    $sort: { _id: 1 } // Chronological order
  }
]);
```

---

### 3. Average Quiz Score
Computes the mean percentage correctness score of completed quizzes.

```javascript
db.quiz_results.aggregate([
  { 
    $match: { 
      userId: ObjectId("USER_ID_HERE") 
    } 
  },
  { 
    $project: {
      percentageScore: {
        $cond: {
          if: { $gt: ["$totalQuestions", 0] },
          then: { $multiply: [ { $divide: ["$score", "$totalQuestions"] }, 100 ] },
          else: 0
        }
      }
    }
  },
  {
    $group: {
      _id: "$userId",
      averageScore: { $avg: "$percentageScore" }
    }
  }
]);
```

---

### 4. Current Streak Check
Calculates consecutive study days by analyzing active recall dates sequentially.

```javascript
db.study_sessions.aggregate([
  { 
    $match: { 
      userId: ObjectId("USER_ID_HERE"),
      type: "study" 
    } 
  },
  {
    $project: {
      dateOnly: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } }
    }
  },
  { 
    $group: { 
      _id: "$dateOnly" 
    } 
  },
  { 
    $sort: { _id: -1 } // Sort newest first
  }
  // The backend controller determines consecutive day gaps in JavaScript matching these dates.
]);
```

---

### 5. Leaderboard Rank Calculation
Finds a user's absolute position relative to other learners based on `aetherPoints`.

```javascript
db.users.aggregate([
  { 
    $match: { 
      optedInLeaderboard: true 
    } 
  },
  { 
    $sort: { 
      aetherPoints: -1 
    } 
  },
  { 
    $group: { 
      _id: null, 
      rankedUsers: { $push: "$_id" } 
    } 
  },
  { 
    $project: {
      rankPosition: { $indexOfArray: ["$rankedUsers", ObjectId("USER_ID_HERE")] },
      totalLearners: { $size: "$rankedUsers" }
    }
  },
  {
    $project: {
      rank: { $add: ["$rankPosition", 1] }, // Adding 1 for 1-based indexing
      totalLearners: 1
    }
  }
]);
```
