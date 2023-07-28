
var boat : Model, dock : Model;
var player : Model, fish : Model;
var water : Model;
var bgm_id : number = 0;
var chm_id : number = 0;
var tap_id : number = 0;

var pole : Model;
var fishModel : Model[];
var fishCaught = 0;

var fishingTimer : number = 10.0;

const TIMEOUT_LENGTH: number = 2.0;

var fishingEventTimeout : number = TIMEOUT_LENGTH;
var fishingTriggered : boolean = false;
var fishingEventTriggered : boolean = false;

const SUBDIV_COUNT : number = 10.0;

class Fish {
    position: number[] = [0, 0, 0]
    kind: number = 0
    velocity: number[] = [1, 0, 1]
    angle: number = 0
}

var fishes : Fish[];

function setup_water() {
    water.mesh = new Mesh();

    var vert_array = [];
    var col_array = [];
    var norm_array = [];
    var tex_array = [];
    var idx_array = [];

    var faceCount = 0;

    for(var x = 0; x < SUBDIV_COUNT; x++) {
        for(var y = 0; y < SUBDIV_COUNT; y++) {
            const SUBDIVL = 1.0 / SUBDIV_COUNT;
            vert_array.push(-0.5 + SUBDIVL * x, -0.5 + SUBDIVL * y, 0);
            vert_array.push(-0.5 + SUBDIVL * (x+1), -0.5 + SUBDIVL * y, 0);
            vert_array.push(-0.5 + SUBDIVL * (x+1), -0.5 + SUBDIVL * (y+1), 0);
            vert_array.push(-0.5 + SUBDIVL * x, -0.5 + SUBDIVL * (y+1), 0);

            col_array.push(1, 1, 1, 0.9);
            col_array.push(1, 1, 1, 0.9);
            col_array.push(1, 1, 1, 0.9);
            col_array.push(1, 1, 1, 0.9);

            norm_array.push(0, -1, 0);
            norm_array.push(0, -1, 0);
            norm_array.push(0, -1, 0);
            norm_array.push(0, -1, 0);

            tex_array.push(0, 0);
            tex_array.push(0, 0);
            tex_array.push(0, 0);
            tex_array.push(0, 0);

            idx_array.push(0 + faceCount * 4, 1 + faceCount * 4, 2 + faceCount * 4, 2 + faceCount * 4, 3 + faceCount * 4, 0 + faceCount * 4);
            faceCount++;
        }
    }

    water.mesh.vert_array = new Float32Array(vert_array);
    water.mesh.col_array = new Float32Array(col_array);
    water.mesh.norm_array = new Float32Array(norm_array);
    water.mesh.tex_array = new Float32Array(tex_array);
    water.mesh.idx_array = new Int16Array(idx_array);
    water.mesh.setup_mesh();
}

async function main(): Promise<void> {
    yz_initialize_engine();

    bgm_id = YZ_AudioManager.load_audio("bgm", "audio/music.mp3");
    chm_id = YZ_AudioManager.load_audio("chm", "audio/chime.wav");
    tap_id = YZ_AudioManager.load_audio("tap", "audio/tap.wav");
    YZ_AudioManager.get_clip(bgm_id).loop();
    
    var boatMat = new PhongToonMaterial();
    boatMat.color = [1, 1, 1];
    boatMat.texture_id = YZ_TextureManager.load_texture("boat", "model/boat.png", _gl.REPEAT, _gl.LINEAR, _gl.LINEAR);
    boatMat.settings.set("noTex", {type: ValueType.Int, value: 0});

    var brownMat = new PhongToonMaterial();
    brownMat.color = [0.125, 0.05, 0];
    brownMat.settings.set("noTex", {type: ValueType.Int, value: 1});

    var tanMat = new PhongToonMaterial();
    tanMat.color = [1.0, 1.0, 1.0];
    tanMat.texture_id = YZ_TextureManager.load_texture("char", "model/char.jpg", _gl.REPEAT, _gl.LINEAR_MIPMAP_LINEAR, _gl.LINEAR_MIPMAP_LINEAR);
    tanMat.settings.set("noTex", {type: ValueType.Int, value: 0});

    var waterMat = new PhongToonMaterial();
    waterMat.color = [0.0, 0.3, 1.0];
    waterMat.settings.set("noTex", {type: ValueType.Int, value: 1});

    boat = new Model();
    await boat.loadOBJ("model/boat.obj");
    boat.material = boatMat;
    boat.transform.position = [-6, -4, -3];
    boat.transform.rotation = [0, 0, 0];
    boat.transform.scale = [.01, .01, .01];
    boat.transform.update();

    dock = new Model();
    await dock.loadOBJ("model/dock.obj");
    dock.material = brownMat;
    dock.transform.position = [-15, -2, -2];
    dock.transform.rotation = [0, -45, 0];
    dock.transform.scale = [.01, .01, .01];
    dock.transform.update();

    player = new Model();
    await player.loadOBJ("model/player.obj");
    player.material = tanMat;
    player.transform.position = [-2.35, -1.5, -5];
    player.transform.rotation = [0, 45, 0];
    player.transform.scale = [0.5, 0.5, 0.5];
    player.transform.update();

    pole = new Model();
    await pole.loadOBJ("model/pole.obj");
    pole.material = brownMat;
    pole.transform.position = [-2.6, -0.6, -4];
    pole.transform.rotation = [20, 0, 0];
    pole.transform.scale = [0.0125, 0.0125, 0.0125];
    pole.transform.update();
    
    water = new Model();

    setup_water();
    
    water.material = waterMat;
    water.transform.position = [-3, -4, -6.4];
    water.transform.rotation = [-90, -45, 0];
    water.transform.scale = [256, 256, 0.5];
    water.transform.update();
    
    fishModel = new Array<Model>(14);

    for(var i = 0; i < 14; i++) {
        var mat = new PhongToonMaterial();
        mat.color = [1, 1, 1];
        mat.settings.set("noTex", {type: ValueType.Int, value: 0});
        mat.texture_id = YZ_TextureManager.load_texture(i.toString(), "model/fish/" + (i+1).toString() + ".png", _gl.REPEAT, _gl.NEAREST, _gl.NEAREST);

        fishModel[i] = new Model();
        await fishModel[i].loadOBJ("model/fish/" + (i+1).toString() + ".obj");
        fishModel[i].material = mat;
        fishModel[i].transform.position = [-2, -4, -5];
        fishModel[i].transform.rotation = [0, 0, 0];
        fishModel[i].transform.scale = [0.0625, 0.0625, 0.0625];
        if(i == 7 || i == 8 || i == 9) {
            fishModel[i].transform.scale = [0.03125, 0.03125, 0.03125];
        }
        fishModel[i].transform.update();
    }
    
    fishes = new Array<Fish>(25);

    for(var i = 0; i < 25; i++) {
        fishes[i] = new Fish();
        fishes[i].kind = Math.floor(Math.random() * 14.0);
        fishes[i].position = [Math.random() * 3 - 2, -4, Math.random() * 2 - 5];
        fishes[i].velocity = [(Math.random() - 0.5) * 4.0, 0, (Math.random() - 0.5) * 4.0];
        fishes[i].angle = Math.random() * 360.0;
    }

    YZ_PassManager.postProcessStack.pushLayer(new PostProcessLayer("edge"));
    YZ_PassManager.postProcessStack.pushLayer(new PostProcessLayer("fxaa"));
    
    YZ_LightManager.addLight(new Light(LightType.Directional, [0, 0, 0], [1.0, 0.5, 0.0], 1.0, [0, -1, -1], 10.0));

    YZ_UpdateFunc = gameUpdate;
    YZ_RenderFunc = gameDraw;
    yz_main_loop();
}

var animTimer = 0.0;

function anim_water(animTimer: number) {
    for(var i = 0; i < (water.mesh.vert_array.length / 3); i++) {
        var x = water.mesh.vert_array[i * 3 + 0];
        var z = water.mesh.vert_array[i * 3 + 1];
        water.mesh.vert_array[i * 3 + 2] = Math.sin(animTimer + x * 5 + z * 10.0);
    }

    water.mesh.setup_mesh();
}

function gameDraw(dt: number) {
    yz_render_clear_color_int(255, 90, 45, 255);
    yz_render_clear();

    animTimer += dt;
    anim_water(animTimer);

    boat.draw();
    dock.draw();
    player.draw();
    pole.draw();

    for(var i = 0; i < 25; i++) {
        var p = fishes[i].position;

        p[0] += fishes[i].velocity[0] * dt;
        p[2] += fishes[i].velocity[2] * dt;

        if(p[0] > 2) {
            fishes[i].velocity[0] = -fishes[i].velocity[0];
            p = fishes[i].position;
        }
        
        if(p[0] < -15) {
            fishes[i].velocity[0] = -fishes[i].velocity[0]; 
            p = fishes[i].position;
        }
        
        if(p[2] > -4) {
            fishes[i].velocity[2] = -fishes[i].velocity[2]; 
            p = fishes[i].position;
        } 
        
        if(p[2] < -20) {
            fishes[i].velocity[2] = -fishes[i].velocity[2]; 
            p = fishes[i].position;
        }

        fishes[i].angle += dt * 30.0;
        var index = fishes[i].kind;

        fishModel[index].transform.position[1] = Math.sin(animTimer) * 0.15 - 4.2;
        fishModel[index].transform.position[0] = fishes[i].position[0];
        fishModel[index].transform.position[2] = fishes[i].position[2];
        fishModel[index].transform.rotation[1] = fishes[i].angle;
        
        fishModel[index].transform.update();
        fishModel[index].draw();
    }

    
    water.draw();

    YZ_FontRenderer.beginDraw();
    YZ_FontRenderer.drawText("center", "Fishing", [0.5, 0.05]);
    YZ_FontRenderer.drawText("right", "Fish Caught: " + fishCaught, [0.95, 0.05]);

    if (fishingEventTriggered) { 
        YZ_FontRenderer.drawText("center", "Tap to Fish!", [0.5, 0.5], "red");
    }
}

function gameUpdate(dt: number) {
    if(YZ_AudioManager.get_clip(bgm_id).clipObject.paused) {
        YZ_AudioManager.get_clip(bgm_id).play();
    }

    fishingTimer -= dt;

    if(fishingTimer < 0.0 && !fishingEventTriggered) {
        fishingEventTriggered = true;
        fishingEventTimeout = TIMEOUT_LENGTH;
        YZ_AudioManager.get_clip(chm_id).play();
    }

    if(fishingEventTriggered) {
        fishingEventTimeout -= dt;

        if(fishingEventTimeout < 0.0) {
            fishingEventTriggered = false;
            fishingTimer = 10.0 + Math.random() * 10.0;
        } else if(InputManager.mouseDown || InputManager.touchDown) {
            YZ_AudioManager.get_clip(chm_id).stop();
            YZ_AudioManager.get_clip(tap_id).play();
            fishCaught++;
            fishingEventTriggered = false;
            fishingTimer = 10.0 + Math.random() * 10.0;
        }
    }

    YZ_Camera.transform.rotation[0] = 30;
    YZ_Camera.transform.rotation[1] = -30;
    YZ_Camera.transform.rotation[2] = -15;
    
    YZ_Camera.transform.position[0] = 1;
    YZ_Camera.transform.position[1] = -1;
    YZ_Camera.transform.position[2] = 1;
}