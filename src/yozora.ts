var YZ_DefaultColorMaterial: Material;
var YZ_DefaultTextureMaterial: Material;
var YZ_PhongMaterial: PhongMaterial;
var YZ_LambertMaterial: LambertMaterial;
var YZ_PhongToonMaterial: PhongToonMaterial;
var YZ_LambertToonMaterial: LambertToonMaterial;

/**
 * Single function initialization
 */
function yz_initialize_engine(): void {
    yz_render_init_context();

    YZ_InputManager = new InputManager();
    YZ_AudioManager = new AudioManager();

    console.log("Initialized Game Engine!")
}

var YZ_UpdateFunc = (dt: number) => {};
var YZ_RenderFunc = (dt: number) => {};


var _lastUpdate = Date.now();
function yz_main_loop() {
    var now = Date.now();
    var dt = (now - _lastUpdate) / 1000.0;
    _lastUpdate = now;

    InputManager.update();

    YZ_UpdateFunc(dt);

    YZ_PassManager.startRenderPass();
    YZ_Camera.update();
    YZ_FontRenderer.beginDraw();

    YZ_RenderFunc(dt);

    // Does post process AND presents to screen
    YZ_PassManager.doPostPresent();
    requestAnimationFrame(yz_main_loop);    
}