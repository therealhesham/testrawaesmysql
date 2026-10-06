import prisma from './prisma';

/**
 * Parses flight departure date and time strings into a valid local Date object.
 * Supports:
 * - date: "YYYY-MM-DD", ISO Date strings, or Date objects
 * - time: "HH:mm", "HH:mm م", "HH:mm ص", "HH:mm PM", "HH:mm AM"
 */
export function parseFlightDateTime(
  dateInput?: string | Date | null,
  timeInput?: string | null
): Date | null {
  if (!dateInput) return null;

  let year: number;
  let month: number;
  let day: number;

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    year = dateInput.getFullYear();
    month = dateInput.getMonth();
    day = dateInput.getDate();
  } else {
    const raw = String(dateInput).trim();
    const dateMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (dateMatch) {
      year = parseInt(dateMatch[1], 10);
      month = parseInt(dateMatch[2], 10) - 1;
      day = parseInt(dateMatch[3], 10);
    } else {
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) return null;
      year = parsed.getFullYear();
      month = parsed.getMonth();
      day = parsed.getDate();
    }
  }

  let hours = 0;
  let minutes = 0;

  if (timeInput && typeof timeInput === 'string') {
    const cleanTime = timeInput.trim();
    const isPM = cleanTime.includes('م') || cleanTime.toLowerCase().includes('pm');
    const isAM = cleanTime.includes('ص') || cleanTime.toLowerCase().includes('am');
    const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }
  }

  return new Date(year, month, day, hours, minutes, 0, 0);
}

let isProcessingDepartures = false;

/**
 * Scans all active housed workers that have deportationData with a scheduled flight date/time.
 * If the scheduled flight departure time has passed (<= current time),
 * it executes the departure automatically in the database.
 */
export async function processDueScheduledDepartures(): Promise<number> {
  if (isProcessingDepartures) {
    return 0;
  }
  isProcessingDepartures = true;

  let executedCount = 0;
  try {
    const now = new Date();

    // Query active workers currently in housing with deportationData attached
    const scheduledWorkers = await prisma.housedworker.findMany({
      where: {
        deparatureHousingDate: null,
        deportationData: { not: null as any },
      },
      include: {
        Order: true,
        externalHomedmaid: true,
      },
    });

    for (const worker of scheduledWorkers) {
      const depData = worker.deportationData as any;
      if (!depData) continue;

      const scheduledDate = depData.externaldeparatureDate;
      const scheduledTime = depData.externaldeparatureTime;
      const scheduledDateTime = parseFlightDateTime(scheduledDate, scheduledTime);

      if (scheduledDateTime && scheduledDateTime.getTime() <= now.getTime()) {
        const finalReason = depData.externalReason
          ? `ترحيل: ${depData.externalReason}`
          : 'ترحيل العاملة';
        const actualHomeMaidId = worker.homeMaid_id;

        // 1. Atomic update to guarantee single execution even with concurrent calls
        const updateResult = await prisma.housedworker.updateMany({
          where: {
            id: worker.id,
            deparatureHousingDate: null,
          },
          data: {
            isActive: false,
            deparatureReason: finalReason,
            deparatureHousingDate: scheduledDateTime,
          },
        });

        // If count is 0, another process already handled this worker -> skip
        if (updateResult.count === 0) {
          continue;
        }

        // Deactivate active check-ins
        try {
          await prisma.checkIn.updateMany({
            where: {
              housedWorkerId: worker.id,
              isActive: true,
            },
            data: { isActive: false },
          });
        } catch (checkInErr) {
          console.error('Error updating checkIns on auto-departure:', checkInErr);
        }

        // 2. Update homemaid status and hide neworders
        if (actualHomeMaidId) {
          try {
            await prisma.homemaid.update({
              where: { id: actualHomeMaidId },
              data: {
                isApproved: false,
                bookingstatus: 'مغادرة خارجية',
              },
            });

            await prisma.neworder.updateMany({
              where: { HomemaidId: actualHomeMaidId },
              data: { isHidden: true },
            });
          } catch (maidErr) {
            console.error('Error updating homemaid on auto-departure:', maidErr);
          }
        }

        // 3. Create log once
        try {
          const workerName =
            worker.Order?.Name || worker.externalHomedmaid?.name || `عاملة #${worker.id}`;
          await prisma.logs.create({
            data: {
              homemaidId: actualHomeMaidId ? Number(actualHomeMaidId) : undefined,
              Details: `تنفيذ تلقائي لمغادرة وترحيل العاملة (${workerName}) بحلول موعد الرحلة المحدد (${scheduledTime || ''})`,
              reason: 'مغادرة السكن',
              Status: 'مغادرة السكن',
            },
          });
        } catch (logErr) {
          console.error('Error creating log on auto-departure:', logErr);
        }

        executedCount++;
      }
    }
  } catch (error) {
    console.error('Error in processDueScheduledDepartures:', error);
  } finally {
    isProcessingDepartures = false;
  }

  return executedCount;
}
