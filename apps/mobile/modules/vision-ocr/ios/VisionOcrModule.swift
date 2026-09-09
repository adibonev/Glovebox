import ExpoModulesCore
import UIKit
import Vision

/**
 Text recognition through Apple's Vision framework.

 The app previously ran Tesseract inside a WebView, which is the only way to get Cyrillic
 recognition that works on both platforms — but it is an engine trained on scanned pages,
 running through JavaScript, and it takes seconds. Vision is trained on photographs taken with
 a phone, which is what a User actually has: a certificate held at an angle, under a lamp, with
 glare across it. It answers in a fraction of a second, which is also what makes reading many
 frames in a row possible later.

 Two passes, joined, for the same reason the WebView did two: language correction repairs
 Cyrillic words that came out damaged, and mangles codes. A VIN "corrected" into a word reads
 exactly as convincingly as one that was never touched, so the pass that finds the VIN must not
 have it, and the pass that reads the labels wants it.
 */
public class VisionOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VisionOcr")

    /// Which languages this device can recognise — the caller asks before relying on Cyrillic.
    AsyncFunction("supportedLanguages") { () -> [String] in
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      return (try? request.supportedRecognitionLanguages()) ?? []
    }

    /// Recognise `source` (a `file://` URL or a `data:` URL) and return the text of both passes.
    AsyncFunction("recognize") { (source: String, languages: [String]) -> String in
      guard let cgImage = Self.loadImage(source) else {
        throw ImageUnreadableException()
      }

      let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up, options: [:])
      let corrected = try Self.read(handler, languages: languages, correcting: true)
      let literal = try Self.read(handler, languages: languages, correcting: false)
      return [corrected, literal].joined(separator: "\n")
    }
  }

  private static func read(
    _ handler: VNImageRequestHandler,
    languages: [String],
    correcting: Bool
  ) throws -> String {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = correcting

    // Ask only for languages this device actually has; an unsupported one makes Vision throw.
    let supported = (try? request.supportedRecognitionLanguages()) ?? []
    let usable = languages.filter { supported.contains($0) }
    if !usable.isEmpty {
      request.recognitionLanguages = usable
    }

    try handler.perform([request])

    return (request.results ?? [])
      .compactMap { $0.topCandidates(1).first?.string }
      .joined(separator: "\n")
  }

  private static func loadImage(_ source: String) -> CGImage? {
    if source.hasPrefix("data:") {
      guard let comma = source.firstIndex(of: ","),
            let data = Data(base64Encoded: String(source[source.index(after: comma)...])),
            let image = UIImage(data: data)
      else { return nil }
      return image.cgImage
    }

    if let url = URL(string: source), url.isFileURL,
       let data = try? Data(contentsOf: url),
       let image = UIImage(data: data) {
      return image.cgImage
    }

    return UIImage(contentsOfFile: source)?.cgImage
  }
}

internal final class ImageUnreadableException: Exception {
  override var reason: String {
    "Снимката не можа да бъде отворена за разчитане."
  }
}
