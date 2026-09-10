const durationPattern = /^(\d+)([smhd])$/

export const durationToMilliseconds = (value: string): number => {
  const match = durationPattern.exec(value)

  if (!match) {
    throw new Error(
      `Invalid duration format: ${value}. Use values such as 15m or 7d.`,
    )
  }

  const amount = Number(match[1])
  const unit = match[2]
  const unitMilliseconds =
    unit === 's'
      ? 1000
      : unit === 'm'
        ? 60_000
        : unit === 'h'
          ? 3_600_000
          : 86_400_000

  return amount * unitMilliseconds
}
