SettingsVFBChannels _SettingsVFBChannels {
  channel_names=ListString(
    "RGB color",
    "Alpha"
  );
  zdepth_black=0.001;
  zdepth_white=1500;
  zdepth_clamp=1;
}

RTEngine _RTEngine {
  enabled=0;
  separate_window=0;
  use_opencl=0;
  //trace_depth=5;
  //use_gi=1;
  //gi_depth=3;
  //gi_reflective_caustics=0;
  //gi_refractive_caustics=1;
  //bundle_size=16;
  //samples_per_pixel=4;
  //coherent_tracing=0;
  //stereo_mode=0;
  //stereo_eye_distance=6.5;
  //stereo_focus=2;
  //opencl_texsize=512;
}

SettingsCamera _SettingsCamera {
  type=0;
  height=400;
  dist=2;
  fov=0.619043;
  auto_fit=1;
  curve=1;
  dont_affect_settings=0;
}

SettingsCameraDof _SettingsCameraDof {
  on=0;
  aperture=5;
  center_bias=0;
  focal_dist=200;
  sides_on=0;
  sides_num=5;
  rotation=0;
  anisotropy=0;
  subdivs=6;
}

SettingsCaustics _SettingsCaustics {
  on=0;
  max_photons=60;
  search_distance=5;
  max_density=0;
  multiplier=1;
  mode=0;
  file="";
  dont_delete=1;
  auto_save=0;
  auto_save_file="";
  show_calc_phase=0;
}

SettingsColorMapping _SettingsColorMapping {
  type=6;
  affect_background=1;
  dark_mult=1;
  bright_mult=0.8;
  gamma=2.2;
  subpixel_mapping=0;
  clamp_output=0;
  clamp_level=1;
  adaptation_only=0;
  linearWorkflow=1;
}

SettingsDefaultDisplacement _SettingsDefaultDisplacement {
  override_on=0;
  edgeLength=4;
  viewDependent=1;
  maxSubdivs=256;
  tightBounds=1;
  amount=1;
  relative=0;
}

SettingsDMCGI _SettingsDMCGI {
  subdivs=8;
  depth=3;
}

SettingsDMCSampler _SettingsDMCSampler {
  time_dependent=0;
  adaptive_amount=0.85;
  adaptive_threshold=0.01;
  adaptive_min_samples=8;
  subdivs_mult=1;
  path_sampler_type=2;
}

SettingsDR _SettingsDR {
  on=0;
}

BitmapBuffer _SettingsEnvironment_Texture_BitmapBuffer {
  filter_type=1;
  filter_blur=20;
  color_space=1;
  gamma=1;
  maya_compatible=0;
  allow_negative_colors=0;
  file="default.exr";
  frame_sequence=0;
  frame_number=0;
  frame_offset=0;
  use_data_window=1;
}

UVWGenEnvironment _SettingsEnvironment_Texture_UVWGen {
  uvw_matrix=Matrix(Vector(1, 0, 0), Vector(0, 1, 0), Vector(0, 0, 1));
  uvw_transform=Transform(Matrix(Vector(1, 0, 0), Vector(0, 1, 0), Vector(0, 0, 1)), Vector(0, 0, 0));
  mapping_type="spherical";
  wrap_u=0;
  wrap_v=0;
  wrap_w=0;
  crop_u=0;
  crop_v=0;
  crop_w=0;
  duvw_scale=1;
}

TexBitmap _SettingsEnvironment_Texture {
  compatibility_with=0;
  alpha_from_intensity=0;
  invert=0;
  invert_alpha=0;
  alpha_mult=1;
  alpha_offset=0;
  tile=1;
  uvwgen=_SettingsEnvironment_Texture_UVWGen;
  placement_type=0;
  u=0;
  v=0;
  w=1;
  h=1;
  jitter=0;
  tile_u=0;
  tile_v=0;
  uv_noise_on=0;
  uv_noise_animate=0;
  uv_noise_amount=1;
  uv_noise_levels=1;
  uv_noise_size=1;
  un_noise_phase=0;
  bitmap=_SettingsEnvironment_Texture_BitmapBuffer;
}

TexAColorOp _SettingsEnvironment_gi_tex {
  color_a=_SettingsEnvironment_Texture;
  mult_a=1;
  mode=0;
}

BitmapBuffer _SettingsEnvironment_Texture1_BitmapBuffer {
  filter_type=1;
  filter_blur=0.15;
  color_space=1;
  gamma=1;
  maya_compatible=0;
  allow_negative_colors=0;
  file="default.exr";
  frame_sequence=0;
  frame_number=0;
  frame_offset=0;
  use_data_window=1;
}

UVWGenEnvironment _SettingsEnvironment_Texture1_UVWGen {
  uvw_matrix=Matrix(Vector(1, 0, 0), Vector(0, 1, 0), Vector(0, 0, 1));
  uvw_transform=Transform(Matrix(Vector(1, 0, 0), Vector(0, 1, 0), Vector(0, 0, 1)), Vector(0, 0, 0));
  mapping_type="spherical";
  wrap_u=0;
  wrap_v=0;
  wrap_w=0;
  crop_u=0;
  crop_v=0;
  crop_w=0;
  duvw_scale=1;
}

TexBitmap _SettingsEnvironment_Texture1 {
  compatibility_with=0;
  alpha_from_intensity=0;
  invert=0;
  invert_alpha=0;
  alpha_mult=1;
  alpha_offset=0;
  tile=1;
  uvwgen=_SettingsEnvironment_Texture1_UVWGen;
  placement_type=0;
  u=0;
  v=0;
  w=1;
  h=1;
  jitter=0;
  tile_u=0;
  tile_v=0;
  uv_noise_on=0;
  uv_noise_animate=0;
  uv_noise_amount=1;
  uv_noise_levels=1;
  uv_noise_size=1;
  un_noise_phase=0;
  bitmap=_SettingsEnvironment_Texture1_BitmapBuffer;
}

TexAColorOp _SettingsEnvironment_reflect_tex {
  color_a=AColor(0, 0, 0, 1);
  mult_a=1;
  mode=0;
}

TexAColorOp _SettingsEnvironment_refract_tex {
  color_a=AColor(0, 0, 0, 1);
  mult_a=1;
  mode=0;
}

TexAColorOp _SettingsEnvironment_bg_tex {
  color_a=_SettingsEnvironment_Texture1;
  mult_a=1;
  mode=0;
}

SettingsEnvironment _SettingsEnvironment {
  bg_tex=_SettingsEnvironment_bg_tex;
  bg_tex_mult=1;
  gi_tex=_SettingsEnvironment_gi_tex;
  gi_tex_mult=1;
  reflect_tex=_SettingsEnvironment_reflect_tex;
  reflect_tex_mult=1;
  refract_tex=_SettingsEnvironment_refract_tex;
  refract_tex_mult=1;
  num_environment_objects=0;
  use_bg=1;
  use_gi=1;
  use_reflect=0;
  use_refract=0;
}

SettingsGI _SettingsGI {
  on=1;
  refract_caustics=1;
  reflect_caustics=0;
  saturation=1;
  contrast=1;
  contrast_base=0.5;
  primary_engine=0;
  primary_multiplier=1;
  secondary_engine=2;
  secondary_multiplier=1;
  ray_distance_on=0;
  ray_distance=100000;
  ao_on=0;
  ao_amount=0.8;
  ao_radius=10;
  ao_subdivs=8;
}

SettingsImageFilter _SettingsImageFilter {
  on=1;
  type=5;
  size=1.5;
}

SettingsImageSampler _SettingsImageSampler {
  type=1;
  fixed_subdivs=1;
  dmc_minSubdivs=1;
  dmc_maxSubdivs=4;
  dmc_threshold=0.01;
  dmc_show_samples=0;
  subdivision_minRate=-1;
  subdivision_maxRate=2;
  subdivision_jitter=1;
  subdivision_threshold=0.1;
  subdivision_edges=0;
  subdivision_normals=0;
  subdivision_normals_threshold=0.05;
  subdivision_show_samples=0;
}

SettingsIrradianceMap _SettingsIrradianceMap {
  min_rate=-3;
  max_rate=-2;
  subdivs=50;
  interp_samples=20;
  calc_interp_samples=15;
  interp_frames=2;
  color_threshold=0.4;
  normal_threshold=0.3;
  distance_threshold=0.1;
  detail_enhancement=0;
  detail_radius=60;
  detail_subdivs_mult=0.3;
  detail_scale=0;
  randomize_samples=1;
  interpolation_mode=1;
  lookup_mode=3;
  mode=0;
  dont_delete=1;
  file="";
  show_samples=0;
  show_calc_phase=1;
  show_direct_light=1;
  multiple_views=0;
  multipass=1;
  check_sample_visibility=0;
  auto_save=0;
  auto_save_file="";
}

SettingsLightCache _SettingsLightCache {
  subdivs=500;
  sample_size=0.02;
  filter_type=1;
  filter_samples=5;
  filter_size=0.06;
  prefilter=0;
  prefilter_samples=10;
  depth=100;
  show_calc_phase=1;
  store_direct_light=1;
  world_scale=0;
  mode=0;
  file="";
  dont_delete=1;
  auto_save=1;
  auto_save_file="";
  num_passes=0;
  use_for_glossy_rays=0;
  adaptive_sampling=0;
  multiple_views=0;
  retrace_enabled=0;
  retrace_threshold=1;
}

SettingsMotionBlur _SettingsMotionBlur {
  on=0;
  geom_samples=2;
  low_samples=1;
  duration=1;
  subdivs=6;
  bias=0;
  interval_center=0.5;
}

SettingsOptions _SettingsOptions {
  geom_displacement=1;
  geom_doHidden=0;
  light_doLights=1;
  light_doDefaultLights=0;
  light_doHiddenLights=0;
  light_doShadows=1;
  light_onlyGI=0;
  gi_dontRenderImage=0;
  mtl_reflectionRefraction=1;
  mtl_limitDepth=0;
  mtl_maxDepth=5;
  mtl_doMaps=1;
  mtl_filterMaps=1;
  mtl_filterMapsForSecondaryRays=0;
  mtl_transpMaxLevels=50;
  mtl_transpCutoff=0.001;
  mtl_override_on=0;
  mtl_glossy=1;
  mtl_uninvertedNormalBump=0;
  geom_backfaceCull=0;
  ray_bias=0.001;
  misc_lowThreadPriority=1;
  misc_abortOnMissingAsset=1;
  misc_transferAssets=1;
  misc_useCachedAssets=1;
}

SettingsOutput _SettingsOutput {
  img_width=533;
  img_height=400;
  img_pixelAspect=1;
  img_file="";
  img_dir="";
  img_file_needFrameNumber=0;
  img_separateAlpha=0;
  img_rawFile=0;
  img_rawFileVFB=2;
  anim_start=0;
  anim_end=1;
  frame_start=0;
  frames_per_second=30;
  rgn_left=0;
  rgn_width=533;
  rgn_top=0;
  rgn_height=400;
  bmp_width=533;
  bmp_height=400;
  r_left=0;
  r_width=533;
  r_top=0;
  r_height=400;
  frame_stamp_enabled=0;
  frame_stamp_text="";
}

SettingsPhotonMap _SettingsPhotonMap {
  bounces=10;
  max_photons=30;
  prefilter=0;
  prefilter_samples=10;
  mode=0;
  file="";
  auto_search_distance=1;
  search_distance=1e+18;
  convex_hull_estimate=0;
  dont_delete=1;
  auto_save=0;
  auto_save_file="";
  store_direct_light=1;
  multiplier=1;
  max_density=0;
  retrace_corners=0;
  retrace_bounces=10;
  show_calc_phase=0;
}

SettingsRaycaster _SettingsRaycaster {
  maxLevels=80;
  minLeafSize=0;
  faceLevelCoef=1;
  dynMemLimit=0;
  optLevel=0;
}

SettingsRegionsGenerator _SettingsRegionsGenerator {
  xc=32;
  yc=32;
  xymeans=0;
  seqtype=4;
  reverse=0;
}

SettingsUnitsInfo _SettingsUnitsInfo {
  meters_scale=0.3048;
  photometric_scale=0.001;
  scene_upDir=Vector(0, 0, 1);
}

EffectLens _EffectLens {
  bloomWeight=20;
  bloomSize=20;
  bloomShape=4;
  bloomFillEdges=1;
  bloomBuffer=1;
  bloomOn=0;
  glareWeight=50;
  glareSize=20;
  glareOn=0;
  glareType=1;
  glareDiffractionOn=0;
  glareUseObstacleImage=0;
  glareFillEdges=1;
  glareCamSidesOn=1;
  glareNumSides=6;
  glareCamRotation=0;
  glareFNumber=8;
  glareBuffer=1;
}

