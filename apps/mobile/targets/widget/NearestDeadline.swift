import SwiftUI
import WidgetKit

/// The App Group the app writes to (apps/mobile/lib/widget.ts) and this widget reads from.
private let appGroup = "group.bg.glovebox.app"
private let storageKey = "deadlines"

/// One obligation as the app published it. Mirrors `WidgetDeadline` in lib/widget.ts.
struct Deadline: Codable {
  /// The Service Record id: a tap opens its renewal.
  let id: String
  let label: String
  /// A word short enough for the circular lock-screen widget ("ГО", "ГТП", "Каско").
  let short: String
  let vehicle: String
  /// The Expiry Date as "YYYY-MM-DD": the last valid day, not the first day late.
  let expiry: String
  /// The Reminder Window in days. The gauge is full this far out and empties toward the date.
  let window: Int
}

private struct Published: Codable {
  let items: [Deadline]
}

struct DeadlineEntry: TimelineEntry {
  let date: Date
  let deadline: Deadline?
}

private enum Store {
  /// The most urgent obligation the app last published; nil before the first publish or with none.
  static func mostUrgent() -> Deadline? {
    guard
      let defaults = UserDefaults(suiteName: appGroup),
      let json = defaults.string(forKey: storageKey),
      let data = json.data(using: .utf8),
      let published = try? JSONDecoder().decode(Published.self, from: data)
    else { return nil }
    return published.items.first
  }
}

extension Deadline {
  /// Whole days from `day` to the Expiry Date in the phone's own calendar: 0 on the last valid
  /// day, negative once it has passed. Counted here, so the widget stays right with the app shut.
  func daysLeft(from day: Date) -> Int? {
    let parts = expiry.split(separator: "-").compactMap { Int($0) }
    guard parts.count == 3 else { return nil }
    let calendar = Calendar.current
    guard let end = calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2])) else {
      return nil
    }
    return calendar.dateComponents([.day], from: calendar.startOfDay(for: day), to: end).day
  }

  /// "15.09.2026".
  var expiryText: String {
    let parts = expiry.split(separator: "-")
    guard parts.count == 3 else { return expiry }
    return "\(parts[2]).\(parts[1]).\(parts[0])"
  }
}

/// "след 12 дни" · "изтича днес" · "изтече преди 3 дни", worded as in the app.
func dueText(_ days: Int) -> String {
  switch days {
  case 0: return "изтича днес"
  case 1: return "след 1 ден"
  case 2...: return "след \(days) дни"
  case -1: return "изтече вчера"
  default: return "изтече преди \(-days) дни"
  }
}

/// The app's own colouring: red once overdue or three days out, amber inside the Reminder Window.
func tone(_ days: Int, window: Int) -> Color {
  if days <= 3 { return Color("expired") }
  if days <= window { return Color("expiring") }
  return Color("valid")
}

private func sampleExpiry() -> String {
  let date = Calendar.current.date(byAdding: .day, value: 12, to: Date()) ?? Date()
  let formatter = DateFormatter()
  formatter.calendar = Calendar(identifier: .gregorian)
  formatter.dateFormat = "yyyy-MM-dd"
  return formatter.string(from: date)
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> DeadlineEntry {
    DeadlineEntry(
      date: Date(),
      deadline: Deadline(
        id: "0", label: "Гражданска отговорност", short: "ГО", vehicle: "BMW 320d", expiry: sampleExpiry(), window: 30
      )
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (DeadlineEntry) -> Void) {
    let deadline = Store.mostUrgent()
    if context.isPreview && deadline == nil {
      completion(placeholder(in: context))
    } else {
      completion(DeadlineEntry(date: Date(), deadline: deadline))
    }
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DeadlineEntry>) -> Void) {
    let deadline = Store.mostUrgent()
    let calendar = Calendar.current
    let today = calendar.startOfDay(for: Date())
    // One entry per midnight for a week: the count goes down on its own. The app republishes
    // whenever it loads, so a renewal or a new car shows up the next time it is opened.
    var entries = [DeadlineEntry(date: Date(), deadline: deadline)]
    for offset in 1...7 {
      if let day = calendar.date(byAdding: .day, value: offset, to: today) {
        entries.append(DeadlineEntry(date: day, deadline: deadline))
      }
    }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

struct NearestDeadlineView: View {
  @Environment(\.widgetFamily) private var family
  let entry: DeadlineEntry

  var body: some View {
    content
      .widgetURL(link)
      .widgetBackground(family)
  }

  /// A deadline that is due opens straight on its renewal; anything else just opens the app.
  private var link: URL? {
    if let deadline = entry.deadline, let days = deadline.daysLeft(from: entry.date), days <= deadline.window {
      return URL(string: "glovebox://renew/\(deadline.id)")
    }
    return URL(string: "glovebox://")
  }

  @ViewBuilder private var content: some View {
    if let deadline = entry.deadline, let days = deadline.daysLeft(from: entry.date) {
      switch family {
      case .accessoryCircular:
        CircularView(deadline: deadline, days: days)
      case .accessoryRectangular:
        RectangularView(deadline: deadline, days: days)
      case .accessoryInline:
        Text("\(deadline.short) \(dueText(days))")
      default:
        SmallView(deadline: deadline, days: days)
      }
    } else {
      switch family {
      case .accessoryCircular:
        ZStack {
          AccessoryWidgetBackground()
          Image(systemName: "checkmark")
        }
      case .accessoryRectangular:
        VStack(alignment: .leading, spacing: 1) {
          Text("Glovebox").font(.headline)
          Text("Няма срокове за следене").font(.caption)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      case .accessoryInline:
        Text("Glovebox: няма срокове")
      default:
        EmptySmallView()
      }
    }
  }
}

/// Lock screen, round: the days left inside a gauge that empties toward the date.
struct CircularView: View {
  let deadline: Deadline
  let days: Int

  var body: some View {
    Gauge(value: fill, in: 0...1) {
      Text(deadline.short)
    } currentValueLabel: {
      VStack(spacing: -2) {
        Text(days < 0 ? "!" : "\(days)").font(.system(size: 20, weight: .semibold, design: .rounded))
        Text(deadline.short).font(.system(size: 9, weight: .medium)).lineLimit(1).minimumScaleFactor(0.6)
      }
    }
    .gaugeStyle(.accessoryCircular)
    .widgetAccentable()
  }

  /// Full a whole Reminder Window out, empty on the day, and full again once overdue, as an alarm.
  private var fill: Double {
    if days < 0 { return 1 }
    return min(1, max(0, Double(days) / Double(max(deadline.window, 1))))
  }
}

/// Lock screen, oblong: what, when, and which car.
struct RectangularView: View {
  let deadline: Deadline
  let days: Int

  var body: some View {
    VStack(alignment: .leading, spacing: 1) {
      Text(deadline.label)
        .font(.headline)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .widgetAccentable()
      Text(dueText(days)).font(.body).lineLimit(1)
      Text("\(deadline.vehicle) · до \(deadline.expiryText)")
        .font(.caption)
        .foregroundStyle(.secondary)
        .lineLimit(1)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// Home screen: the number large, in the app's status colour, on the app's ink.
struct SmallView: View {
  let deadline: Deadline
  let days: Int

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text("НАЙ-БЛИЗЪК СРОК")
        .font(.system(size: 9, weight: .semibold, design: .monospaced))
        .foregroundColor(Color("copper"))
      Spacer(minLength: 0)
      Text("\(abs(days))")
        .font(.system(size: 46, weight: .semibold, design: .serif))
        .foregroundColor(tone(days, window: deadline.window))
        .lineLimit(1)
        .minimumScaleFactor(0.5)
      Text(caption)
        .font(.system(size: 11, weight: .medium))
        .foregroundColor(tone(days, window: deadline.window))
      Spacer(minLength: 0)
      Text(deadline.label)
        .font(.system(size: 13, weight: .semibold))
        .foregroundColor(Color("ivory"))
        .lineLimit(2)
        .minimumScaleFactor(0.8)
      Text(deadline.vehicle)
        .font(.system(size: 11))
        .foregroundColor(Color("muted"))
        .lineLimit(1)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  private var caption: String {
    switch days {
    case 0: return "изтича днес"
    case 1: return "ден"
    case 2...: return "дни"
    case -1: return "ден след срока"
    default: return "дни след срока"
    }
  }
}

struct EmptySmallView: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("Glovebox")
        .font(.system(size: 16, weight: .semibold, design: .serif))
        .foregroundColor(Color("copper"))
      Spacer(minLength: 0)
      Text("Няма срокове за следене.")
        .font(.system(size: 13, weight: .semibold))
        .foregroundColor(Color("ivory"))
      Text("Добави кола в приложението.")
        .font(.system(size: 11))
        .foregroundColor(Color("muted"))
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

extension View {
  /// iOS 17 wants every widget to name its background; before that the view paints its own.
  /// Lock-screen widgets take the system's, the home-screen one the app's ink.
  @ViewBuilder
  func widgetBackground(_ family: WidgetFamily) -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      containerBackground(for: .widget) {
        if family == .systemSmall {
          Color("ink")
        } else {
          Color.clear
        }
      }
    } else if family == .systemSmall {
      background(Color("ink"))
    } else {
      self
    }
  }
}

struct NearestDeadlineWidget: Widget {
  let kind = "NearestDeadline"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      NearestDeadlineView(entry: entry)
    }
    .configurationDisplayName("Най-близък срок")
    .description("Колко дни остават до следващия срок на колата.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .systemSmall])
  }
}
