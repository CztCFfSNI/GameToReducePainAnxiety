var sprite : Sprite;
var idleKit : AnimatedSprite;
var sleepKit : AnimatedSprite;
var petting : AnimatedSprite;
var button : Sprite;

var fishEat : Array<Sprite>;

var isSleeping : boolean = true;
var sleepTimer : number = 0.0;
var doPet : boolean = false;
var petTimer : number = 0.0;

var doFish : boolean = false;
var variant : number = 1;
var fishTimer : number = 0.0;

var bgm_id : number = 0;


async function mainPet(): Promise<void> {
    yz_initialize_engine();

    YZ_LightManager.addLight(new Light(LightType.Directional, [0, 0, 0], [1.0, 0.5, 0.0], 1.0, [0, -1, -1], 10.0));

    sprite = new Sprite(YZ_TextureManager.load_texture("bg", "assets/bg.jpg", _gl.REPEAT, _gl.NEAREST, _gl.NEAREST), 0, 0, 960, 544);
    idleKit = new AnimatedSprite(YZ_TextureManager.load_texture("idle", "assets/idle.png", _gl.REPEAT, _gl.NEAREST, _gl.NEAREST), 0, 0, 512, 512, 1, 2);
    sleepKit = new AnimatedSprite(YZ_TextureManager.load_texture("sleep", "assets/sleepy_kitty.png", _gl.REPEAT, _gl.NEAREST, _gl.NEAREST), 0, 0, 512, 512, 3, 1);
    petting = new AnimatedSprite(YZ_TextureManager.load_texture("pet", "assets/pet.png", _gl.REPEAT, _gl.NEAREST, _gl.NEAREST), 0, 0, 512, 512, 4, 1);
    button = new Sprite(YZ_TextureManager.load_texture("button", "assets/button.png", _gl.REPEAT, _gl.NEAREST, _gl.NEAREST), 0, 0, 192, 192);

    bgm_id = YZ_AudioManager.load_audio("bgm", "assets/ac7.mp3");
    YZ_AudioManager.get_clip(bgm_id).loop();

    idleKit.spriteModel.transform.position[0] = (960 - 512 + 32) / 2;
    idleKit.spriteModel.transform.position[1] = 16;
    idleKit.spriteModel.transform.update();

    
    petting.spriteModel.transform.position[0] = (960 - 512 + 32) / 2;
    petting.spriteModel.transform.position[1] = 16;
    petting.spriteModel.transform.update();

    sleepKit.spriteModel.transform.position[0] = (960 - 512 + 32) / 2;
    sleepKit.spriteModel.transform.position[1] = 16;
    sleepKit.spriteModel.transform.update();

    button.spriteModel.transform.position[0] = (960 - 192) / 2;
    button.spriteModel.transform.position[1] = 384;
    button.spriteModel.transform.position[2] = 1;
    button.spriteModel.transform.update();

    fishEat = new Array<Sprite>(5);
    for(var i = 0; i < 5; i++) {
        var url = "assets/feed_" + (i+1).toString() + ".png";
        fishEat[i] = new Sprite(YZ_TextureManager.load_texture("button", url, _gl.REPEAT, _gl.NEAREST, _gl.NEAREST), 0, 0, 512, 512);

        fishEat[i].spriteModel.transform.position[0] = (960 - 512 + 32) / 2;
        fishEat[i].spriteModel.transform.position[1] = 16;
        fishEat[i].spriteModel.transform.update();
    }

    YZ_UpdateFunc = gUpdate;
    YZ_RenderFunc = gDraw;
    yz_main_loop();
}

var timer_var : number = 0.0

function gDraw(dt: number) {
    yz_render_clear_color_int(90, 255, 45, 255);
    yz_render_clear();
    YZ_MatrixStack.ortho(0, 960, 544, 0, -10, 10);
    YZ_MatrixStack.set_mode_2D();

    timer_var += dt
    if(timer_var > 0.25) {
        var blink = Math.trunc(Math.random() * 10.0);

        if(!isSleeping) {
            if(doPet) {
                petting.tick();
            } else {
                if(blink < 2) {
                    idleKit.currentIdx = 1; 
                    idleKit.tick();
                } else {
                    idleKit.currentIdx = 0; 
                    idleKit.tick();
                }
            }
        } else {
            sleepKit.tick();
        }
        timer_var = 0.0
    }

    if(!isSleeping){
        if(doPet) {
            petting.draw();
        } else {
            if(doFish) {
                fishEat[variant].draw();
            } else {
                idleKit.draw();
            }
        }
    } else {
        sleepKit.draw();
    }
    button.draw()
    sprite.draw()
}

function gUpdate(dt: number) {
    if(YZ_AudioManager.get_clip(bgm_id).clipObject.paused) {
        YZ_AudioManager.get_clip(bgm_id).play();
    }

    if((InputManager.mouseDown || InputManager.touchDown) && (!doFish && !doPet)) {
        if(isSleeping) {
            isSleeping = false;
            sleepTimer = 30.0;
        } else {
            var mx = InputManager.mouseCoordinates[0] / (_gl.canvas as HTMLCanvasElement).clientWidth;
            var my = InputManager.mouseCoordinates[1] / (_gl.canvas as HTMLCanvasElement).clientHeight;

            sleepTimer = 30.0;
            if(mx > 0.4 && mx < 0.6 && my > 0.75 && my < 1.0) {
                doFish = true;
                variant = Math.trunc(Math.random() * 5.0);
                fishTimer = 1.0;
            } else {
                doPet = true;
                petting.currentIdx = 3;
                petTimer = 2.0;    
            }
        }
    }

    sleepTimer -= dt;
    petTimer -= dt;
    fishTimer -= dt;

    if(fishTimer < 0) {
        doFish = false;
    }

    if(petTimer < 0) {
        doPet = false;
    }

    if(sleepTimer < 0) {
        isSleeping = true;
    }
}