Pod::Spec.new do |s|
  s.name           = 'VisionOcr'
  s.version        = '1.0.0'
  s.summary        = 'On-device text recognition through Apple Vision'
  s.description    = 'Reads the text of a photographed document with VNRecognizeTextRequest.'
  s.author         = 'Glovebox'
  s.homepage       = 'https://www.glovebox.bg'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
