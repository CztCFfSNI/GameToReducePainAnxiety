var ball : Model;
var paddle1 : Model;
var paddle2 : Model;
var board : Model;

var bgm : AudioClip;
var sfx : AudioClip;

var ballVelocity = [0, 0];

function sleep(ms : number) {
    return new Promise(
      resolve => setTimeout(resolve, ms)
    );
}

function randomizeBallVelocity() {
    ballVelocity[0] = Math.round(Math.random() * 11) - 5.5;
    ballVelocity[1] = Math.round(Math.random() * 11) - 5.5;

    var ballLength = Math.sqrt(ballVelocity[0] * ballVelocity[0] + ballVelocity[1] * ballVelocity[1]);
    
    if(ballLength != 0) {
        ballVelocity[0] /= ballLength;
        ballVelocity[1] /= ballLength;
    }
}

var ctx : CanvasRenderingContext2D;

async function start(): Promise<void> {

    var textCanvas = document.querySelector("#text") as HTMLCanvasElement;
    ctx = textCanvas.getContext("2d") as CanvasRenderingContext2D;


    yz_initialize_engine();
    
    ball = new Model();
    await ball.loadOBJ("model/ball.obj");
    ball.transform.scale = [0.5, 0.5, 0.5];
    ball.transform.update();
    var val = new Value();
    val.value = 1;
    val.type = ValueType.Int;

    YZ_PhongToonMaterial.settings.set("noTex", val);
    YZ_PhongToonMaterial.ambient = 0.3;
    YZ_PhongToonMaterial.shininess = 4;
    ball.material = YZ_PhongToonMaterial;
    
    var redPaddle = new PhongToonMaterial();
    redPaddle.color = [1, 0.2, 0.2];
    redPaddle.shininess = 2;
    redPaddle.settings.set("noTex", val);
    
    var bluePaddle = new PhongToonMaterial();
    bluePaddle.color = [0.2, 0.7, 1];
    bluePaddle.shininess = 2;
    bluePaddle.settings.set("noTex", val);

    var greenBG = new PhongMaterial();
    greenBG.color = [0.3, 1, 0.3];
    greenBG.shininess = 2;
    greenBG.settings.set("noTex", val);

    paddle1 = new Model();
    await paddle1.loadOBJ("model/paddle.obj");
    paddle1.transform.scale = [0.375, 0.5, 0.31875];
    paddle1.transform.update();
    paddle1.material = redPaddle;
    
    paddle2 = new Model();
    await paddle2.loadOBJ("model/paddle.obj");
    paddle2.transform.scale = [0.375, 0.5, 0.31875];
    paddle2.transform.update();
    paddle2.material = bluePaddle;

    
    board = new Model();
    await board.loadOBJ("model/board.obj");
    board.transform.update();
    board.material = greenBG;

    bgm = new AudioClip("audio/music.mp3");
    bgm.loop();

    sfx = new AudioClip("audio/clip.wav");

    paddle1.transform.position = [8.5, 0, 0];
    paddle1.transform.rotation = [90, 0, 0];
    paddle1.transform.update();

    paddle2.transform.position = [-8.5, 0, 0];
    paddle2.transform.rotation = [90, 0, 180];
    paddle2.transform.update();

    board.transform.position = [0, 0, -1];
    board.transform.rotation = [90, 0, 90];
    board.transform.scale = [1.05, 1.0, 1.27];
    board.transform.update();
    
    YZ_PassManager.postProcessStack.pushLayer(new PostProcessLayer("edge"));
    YZ_PassManager.postProcessStack.pushLayer(new PostProcessLayer("fxaa"));
    
    var light = new Light(LightType.Directional, [0, 0, 0], [1.0, 0.9, 0.75], 1.0, [-0.75, -1, -1], 10.0);

    YZ_LightManager.addLight(light);

    randomizeBallVelocity();

    gameLoop();
}

var scorePlayer = 0;
var scoreAI = 0;

function updateDrawBall(dt: number) {

    var nextPos = ball.transform.position;

    nextPos[0] += ballVelocity[0] * dt * 8.0;
    nextPos[1] += ballVelocity[1] * dt * 8.0;

    if(nextPos[0] > 10.0 || nextPos[0] < -10.0) {

        if(nextPos[0] < -10.0) {
            scoreAI++;
        } else {
            scorePlayer++;
        }

        console.log("Player: %d, AI: %d", scorePlayer, scoreAI);

        nextPos[0] = 0;
        nextPos[1] = 0;
        
        randomizeBallVelocity();

        sfx.play();
    }

    
    if(nextPos[1] > 6.0 || nextPos[1] < -6.0) {
        nextPos[1] = ball.transform.position[1];
        ballVelocity[1] = -ballVelocity[1];
        sfx.play();

    }

    //Physics check

    if(nextPos[0] < -8.1 && nextPos[0] > -8.9) {
        var paddleY = paddle2.transform.position[1];
        if(nextPos[1] < paddleY + 2.0 && nextPos[1] > paddleY - 2.0) {
            nextPos[0] = ball.transform.position[0];
            ballVelocity[0] = -ballVelocity[0] * 1.05;
            ballVelocity[1] -= (paddleY - nextPos[1]) * 0.5;
            sfx.play();    
        }
    }
    
    if(nextPos[0] < 8.9 && nextPos[0] > 8.1) {
        var paddleY = paddle1.transform.position[1];
        if(nextPos[1] < paddleY + 2.0 && nextPos[1] > paddleY - 2.0) {
            nextPos[0] = ball.transform.position[0];
            ballVelocity[0] = -ballVelocity[0] * 1.05;
            ballVelocity[1] -= (paddleY - nextPos[1]) * 0.5;
            sfx.play();    
        }
    }

    ball.transform.position[0] = nextPos[0];
    ball.transform.position[1] = nextPos[1];

    var ballSpeed = ballVelocity[0] * ballVelocity[0] + ballVelocity[1] * ballVelocity[1];
    if(ballVelocity[0] > 0) {
        ball.transform.rotation[1] += dt * 50.0 * ballSpeed;
    } else {
        ball.transform.rotation[1] -= dt * 50.0 * ballSpeed;
    }

    if(ball.transform.position[0] > 10.0) {
        ball.transform.position[0] = 10.0;
    } else if(ball.transform.position[0] < -10.0) {
        ball.transform.position[0] = -10.0;
    } 

    if(ball.transform.position[1] > 6.0) {
        ball.transform.position[1] = 6.0;
    } else if(ball.transform.position[1] < -6.0) {
        ball.transform.position[1] = -6.0;
    } 

    ball.transform.update();
    ball.draw();
}

function updatePlayerPaddle() {
    var mouseY = InputManager.mouseCoordinates[1];

    var canv = _gl.canvas as HTMLCanvasElement;
    var mY = mouseY / canv.clientHeight;
    mY *= 2;
    mY -= 1;
    mY *= -10;
    
    if(mY > 4.9)
        mY = 4.9
    else if(mY < -4.9)
        mY = -4.9;


    paddle2.transform.position = [-8.5, mY, 0];
    paddle2.transform.update();
    paddle2.draw();
}

function updateAIPaddle(dt: number) {

    var diff = paddle1.transform.position[1] - ball.transform.position[1];

    var vel = 8.0;
    var modY = 0.0;

    if(diff >= 0.05) {
        modY = vel * -dt;
    } else if (diff <= -0.05) {
        modY = vel * dt;
    }

    var res = paddle1.transform.position[1] + modY;

    if(res > 4.9)
        res = 4.9;
    else if(res < -4.9)
        res = -4.9;

    paddle1.transform.position = [8.5, res, 0];
    paddle1.transform.update();
    paddle1.draw();
}

var lastUpdate = Date.now();
function gameLoop() {

    const width  = ctx.canvas.clientWidth;
    const height = ctx.canvas.clientHeight;
    if (ctx.canvas.width !== width || ctx.canvas.height !== height) {
        ctx.canvas.width  = width;
        ctx.canvas.height = height;
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.scale(1, 1);
    ctx.font = "36px Atkinson Hyperlegible";
    ctx.textAlign = "left";
    ctx.fillText("Player: " + scorePlayer, 0.175 * ctx.canvas.width, ctx.canvas.height * 0.1);
    
    ctx.textAlign = "right";
    ctx.fillText("AI: " + scoreAI, (1-0.175) * ctx.canvas.width, ctx.canvas.height * 0.1);

    ctx.textAlign = "center";
    ctx.fillText("Pong Demo", 0.5 * ctx.canvas.width, ctx.canvas.height * 0.05);

    
    var now = Date.now();
    var dt = (now - lastUpdate) / 1000.0;
    lastUpdate = now;

    if(bgm.clipObject.paused)
        bgm.play();

    YZ_PassManager.startRenderPass();

    yz_render_clear_color_int(40, 192, 255, 255);
    yz_render_clear();

    YZ_MatrixStack.set_mode_2D();
    YZ_MatrixStack.ortho(-_canvas.width / _canvas.height * 10.0, _canvas.width / _canvas.height * 10.0, -1 * 10.0, 1 * 10.0, -10, 10);

    //Manage the ball
    updateDrawBall(dt);

    //Manage player paddle
    updatePlayerPaddle();

    //Manage AI paddle
    updateAIPaddle(dt);

    board.draw();

    // Does post process AND presents to screen
    YZ_PassManager.doPostPresent();

    requestAnimationFrame(gameLoop);
}
