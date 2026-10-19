// Add real project media here when available. Paths are relative to index.html.
// media: { type: 'image', src: 'assets/media/project.jpg', alt: 'What the image shows' }
// media: { type: 'video', src: 'assets/media/project.mp4', poster: 'assets/media/poster.jpg', alt: 'Demonstration title' }
// media.caption supplies context. Keep metrics and claims tied to verified results.
export const projects = {
  panorama: {
    title: 'Rendering & Panorama Pipeline', category: 'RENDERING / C++ / PYTHON',
    intro: 'Building capture workflows that take a real-time scene beyond a single viewport and into panoramic output.',
    illustration: 'assets/media/panorama-study.svg', illustrationAlt: 'Conceptual cubemap-to-panorama capture workflow', media: null,
    context: 'Panoramic output connects engine-side capture with image processing. This work involved Unreal capture components, render targets, pixel readback, and conversion between image representations.',
    contributions: ['Built capture workflows using SceneCapture2D and SceneCaptureCube.', 'Worked with render targets and pixel readback for image output.', 'Worked with C++ / Python conversion for cubemap-to-equirectangular output.'],
    focus: 'The engineering focus is the path from a scene capture to usable image data: choosing a capture representation, accessing pixels, and preparing the output for conversion.',
    discussion: 'Capture representations, render-target handling, pixel data, image conversion, and the integration between engine-side and processing workflows.',
    tech: ['UE5 C++', 'SceneCapture2D', 'SceneCaptureCube', 'Render targets', 'Pixel readback', 'Python']
  },
  lighting: {
    title: 'Real-Time Lighting & Measurement', category: 'UNREAL ENGINE / LIGHTING / TOOLS',
    intro: 'Connecting interactive scene controls with sun-position workflows and light measurement features for real-time visualization.',
    illustration: 'assets/media/lighting-study.svg', illustrationAlt: 'Conceptual sun path and architectural lighting study', media: null,
    context: 'Interactive visualization needs controllable lighting and ways to inspect its effects. This work brought scene-lighting controls, sun positioning, and lux/luminance measurement features into interactive workflows.',
    contributions: ['Implemented interactive scene-lighting controls.', 'Implemented sun-position workflows for visualization.', 'Worked on lux/luminance measurement features.'],
    focus: 'Connecting scene state, lighting controls, and measurement features so they fit into an interactive visualization workflow.',
    discussion: 'Lighting control integration, sun-position behavior, measurement workflows, and rendering analysis in Unreal Engine.',
    tech: ['Unreal Engine', 'C++', 'Scene lighting', 'Sun positioning', 'Lux / luminance', 'Interactive tools']
  },
  runtime: {
    title: 'Runtime Asset & XR Integration', category: 'UE5 C++ / RUNTIME / OPENXR',
    intro: 'Working across runtime 3D asset integration, scale handling, and VR troubleshooting to support interactive experiences.',
    illustration: 'assets/media/runtime-study.svg', illustrationAlt: 'Conceptual 3D asset and XR tracking volume', media: null,
    context: 'An asset has to fit into a running application, its spatial conventions, and its interaction systems. VR adds another integration surface where runtime behavior and performance need careful investigation.',
    contributions: ['Worked on runtime 3D asset import and integration.', 'Handled scale-related integration concerns.', 'Investigated VR / OpenXR issues and performance-sensitive interactive workflows.'],
    focus: 'Understanding how runtime assets, application behavior, and the VR environment interact, then tracing issues across those boundaries.',
    discussion: 'Runtime asset integration, spatial scale, VR / OpenXR troubleshooting, and performance-sensitive application behavior.',
    tech: ['UE5 C++', 'Runtime integration', '3D assets', 'Scale handling', 'VR', 'OpenXR']
  },
  diagnostics: {
    title: 'Production & Linux Diagnostics', category: 'LINUX / DEBUGGING / DELIVERY',
    intro: 'Investigating issues beyond the viewport: CPU saturation, application failures, and the systems that keep production software running.',
    illustration: 'assets/media/systems-study.svg', illustrationAlt: 'Conceptual process traces and diagnostic terminal', media: null,
    context: 'Production issues can cross application, service, and deployment boundaries. This work involved Linux investigation and coordination across engineering disciplines to locate the cause and support recovery.',
    contributions: ['Investigated CPU / process saturation and application / service failures.', 'Supported deployment issue investigation in Linux environments.', 'Contributed to production root-cause analysis, recovery, and Linux / CI/CD workflows.'],
    focus: 'Following evidence across process behavior, application failures, and deployment conditions to narrow down an issue and coordinate a resolution.',
    discussion: 'Linux process diagnostics, production incident investigation, backend / service integration, and release coordination.',
    tech: ['Linux / Ubuntu', 'Process diagnostics', 'Production support', 'Git / GitHub', 'CI/CD', 'Release workflows']
  }
};
