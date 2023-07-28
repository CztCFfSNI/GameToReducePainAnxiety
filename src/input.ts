var YZ_InputManager: InputManager;

type InputCallback = () => void;

class InputManager {

public static kbCallbackMap: Map<string, InputCallback>
public static mouseCoordinates: [number, number];
public static touchCoordinates: [number, number];
/**
 * 0 = A
 * 1 = B
 * 2 = X
 * 3 = Y
 * 4 = LB
 * 5 = RB
 * 6 = LT
 * 7 = RT
 * 8 = Select
 * 9 = Start
 * 10 = LA (Left Analog)
 * 11 = RA (Right Analog)
 * 12 = Up
 * 13 = Down
 * 14 = Left
 * 15 = Right
 * 16 = XBox / PS button
 */
public static gpCallbackMap: Map<number, InputCallback>
public static axis0: [number, number];
public static axis1: [number, number];
public static mouseDown: boolean;
public static touchDown: boolean;

public static gamepad : number = -1;

constructor() {
    window.addEventListener("keydown", this.kbEventHandler);
    window.addEventListener("mousemove", this.mousePosHandler);
    window.addEventListener("mouseup", this.mouseUpHandler);
    window.addEventListener("mousedown", this.mouseDownHandler);
    window.addEventListener("touchmove", this.touchPosHandler);
    window.addEventListener("touchstart", this.touchDownHandler);
    window.addEventListener("touchend", this.touchUpHandler);
    window.addEventListener("gamepadconnected", this.gamepadConnect);
    window.addEventListener("gamepaddisconnected", this.gamepadDisconnect);
    InputManager.kbCallbackMap = new Map<string, InputCallback>();
    InputManager.gpCallbackMap = new Map<number, InputCallback>();
    InputManager.mouseCoordinates = [0, 0];
    InputManager.touchCoordinates = [0, 0];
    InputManager.mouseDown = false;
}

gamepadConnect(event: GamepadEvent) {
    InputManager.gamepad = event.gamepad.index;
}

gamepadDisconnect(event: GamepadEvent) {
    if(InputManager.gamepad == -1)
        return;

    if(event.gamepad.index == InputManager.gamepad) { 
        InputManager.gamepad = -1;
    }
}

mouseUpHandler(event: MouseEvent) {
    InputManager.mouseDown = false;
    //console.log("RELEASE!");
}

mouseDownHandler(event: MouseEvent) {
    InputManager.mouseDown = true;
    //console.log("CLICK!");
}

kbEventHandler(event: KeyboardEvent) {
    if(event.defaultPrevented){
        return;
    }

    if(InputManager.kbCallbackMap.has(event.code)) {
        var func = InputManager.kbCallbackMap.get(event.code);

        if(func != undefined)
            func();
    }

    event.preventDefault();
}

mousePosHandler(event: MouseEvent) {
    //console.log("cX: ", event.clientX, "cY: ", event.clientY);
    InputManager.mouseCoordinates[0] = event.clientX;
    InputManager.mouseCoordinates[1] = event.clientY;
}

touchPosHandler(event: TouchEvent) {
    var touch = event.touches[0];
    //alert("cX: " + touch.clientX +  "cY: "+  touch.clientY);
    InputManager.touchCoordinates[0] = touch.clientX;
    InputManager.touchCoordinates[1] = touch.clientY;
}

touchUpHandler(event: TouchEvent) {
    InputManager.touchDown = false;
    //alert("RELEASE!");
}

touchDownHandler(event: TouchEvent) {
    InputManager.touchDown = true;
    //alert("CLICK!");
}

static update() : void {
    if(InputManager.gamepad == -1) {
        return;
    }

    const gp = navigator.getGamepads()[InputManager.gamepad];

    if(gp == null) {
        return;
    }
    
    InputManager.axis0 = [gp.axes[0], gp.axes[1]];
    InputManager.axis1 = [gp.axes[2], gp.axes[3]];

    for(var i = 0; i < gp.buttons.length; i++) {
        if(gp.buttons[i].pressed) {
            var func = InputManager.gpCallbackMap.get(i);

            if(func != undefined) {
                func();
            }
        }
    }
}

}