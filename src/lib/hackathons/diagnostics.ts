export function logHackathonOperation({
  channel,
  hackathonId,
  userId,
  route,
  operation,
  result,
}: {
  channel: "HACKATHON_REGISTRATION" | "HACKATHON_PAYMENT";
  hackathonId: string;
  userId?: string;
  route: string;
  operation: string;
  result: string;
}) {
  console.info(`[${channel}]`, {
    hackathonId,
    userId: userId || "anonymous",
    route,
    operation,
    result,
  });
}