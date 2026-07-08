"use client"

// ---------------------------------------------------------------------------
// Scan history is stored in localStorage (key: "scan_history_<userId>").
// This avoids Firestore permission errors caused by the app using
// localStorage-based auth instead of Firebase Authentication.
// All function signatures are identical to the original Firestore version
// so no other component needs to change.
// ---------------------------------------------------------------------------

const SCANS_KEY = (userId) => `scan_history_${userId}`

function readScans(userId) {
  try {
    const raw = localStorage.getItem(SCANS_KEY(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeScans(userId, scans) {
  localStorage.setItem(SCANS_KEY(userId), JSON.stringify(scans))
}

// ─── Save a new scan ────────────────────────────────────────────────────────
export async function saveScan(userId, scanData) {
  try {
    if (!userId) throw new Error("User ID is required to save scan")

    const scans = readScans(userId)
    const newScan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      ...scanData,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    scans.unshift(newScan) // newest first
    writeScans(userId, scans)

    console.log("Scan saved to localStorage with ID:", newScan.id)
    return { id: newScan.id, success: true }
  } catch (error) {
    console.warn("Could not save scan:", error.message)
    return null
  }
}

// ─── Fetch all scans for a user ─────────────────────────────────────────────
export async function getUserScans(userId) {
  try {
    if (!userId) throw new Error("User ID is required to get scans")
    const scans = readScans(userId)
    console.log(`Loaded ${scans.length} scans from localStorage for user:`, userId)
    return scans
  } catch (error) {
    console.warn("Error getting user scans:", error.message)
    return []
  }
}

// ─── Delete a single scan ────────────────────────────────────────────────────
export async function deleteScan(scanId, userId) {
  try {
    if (!scanId || !userId) throw new Error("Scan ID and User ID are required")

    const scans = readScans(userId)
    const filtered = scans.filter((s) => s.id !== scanId)

    if (filtered.length === scans.length) {
      throw new Error("Scan not found.")
    }

    writeScans(userId, filtered)
    console.log("Scan deleted from localStorage:", scanId)
    return { success: true }
  } catch (error) {
    console.warn("Error deleting scan:", error.message)
    throw error
  }
}

// ─── Compute analytics from stored scans ────────────────────────────────────
export async function getUserAnalytics(userId) {
  try {
    if (!userId) throw new Error("User ID is required to get analytics")

    const scans = await getUserScans(userId)

    const drGrades = {
      "No DR": 0,
      Mild: 0,
      Moderate: 0,
      Severe: 0,
      "Proliferative DR": 0,
      Unknown: 0,
    }
    const monthlyScans = {}

    scans.forEach((scan) => {
      const grade = scan.result?.class || scan.result?.grade_label || "Unknown"
      if (drGrades[grade] !== undefined) {
        drGrades[grade] += 1
      } else {
        drGrades["Unknown"] += 1
      }

      try {
        const date = new Date(scan.date)
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        monthlyScans[monthYear] = (monthlyScans[monthYear] || 0) + 1
      } catch (e) {
        console.warn("Error processing date for scan:", scan.id, e)
      }
    })

    return { totalScans: scans.length, drGrades, monthlyScans }
  } catch (error) {
    console.warn("Error generating analytics:", error.message)
    return {
      totalScans: 0,
      drGrades: { "No DR": 0, Mild: 0, Moderate: 0, Severe: 0, "Proliferative DR": 0, Unknown: 0 },
      monthlyScans: {},
    }
  }
}
