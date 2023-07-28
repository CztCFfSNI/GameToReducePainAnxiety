var _fb_model : Mesh | null = null;

/**
 * Framebuffer is a bindable object which stores the result of all render commands which occur after it.
 * Framebuffers also store the color texture (and TODO: the depth and normal buffer) which they output.
 * These can then be used in shaders for purposes like post processing or water reflection.
 */
class Framebuffer {
    framebuffer: WebGLFramebuffer | null;
    color_buffer: WebGLTexture | null;
    depth_buffer: WebGLTexture | null;

    constructor() {
        if(_fb_model == null) {
            _fb_model = new Mesh();
            _fb_model.vert_array = new Float32Array([
                -1, -1, 0.0,
                1, -1, 0.0,
                1, 1, 0.0,
                -1, -1, 0.0,
                -1, 1, 0.0,
                1, 1, 0.0,
            ]);
            _fb_model.col_array = new Float32Array([
                1, 1, 1, 1,
                1, 1, 1, 1,
                1, 1, 1, 1,
                1, 1, 1, 1,
                1, 1, 1, 1,
                1, 1, 1, 1,
            ]);
            _fb_model.norm_array = new Float32Array([
                0.0, 0.0, 0.0,
                0.0, 0.0, 0.0,
                0.0, 0.0, 0.0,
                0.0, 0.0, 0.0,
                0.0, 0.0, 0.0,
                0.0, 0.0, 0.0
            ]);
            _fb_model.tex_array = new Float32Array([
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 0.0,
                0.0, 1.0, 
                1.0, 1.0
            ]);
            _fb_model.idx_array = new Int16Array([0, 1, 2, 3, 4, 5]);
            _fb_model.setup_mesh();
        }
        this.framebuffer = _gl.createFramebuffer();

        if(this.framebuffer == null) {
            yz_error("Could not create framebuffer!");
        }

        _gl.bindFramebuffer(_gl.FRAMEBUFFER, this.framebuffer);

        this.color_buffer = _gl.createTexture();
        _gl.bindTexture(_gl.TEXTURE_2D, this.color_buffer);
        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGB, _gl.canvas.width, _gl.canvas.height, 0, _gl.RGB, _gl.UNSIGNED_BYTE, null);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);

        _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, this.color_buffer, 0);


        this.depth_buffer = _gl.createTexture();
        _gl.bindTexture(_gl.TEXTURE_2D, this.depth_buffer);
        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.DEPTH24_STENCIL8, _gl.canvas.width, _gl.canvas.height, 0, _gl.DEPTH_STENCIL, _gl.UNSIGNED_INT_24_8, null);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
        _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);

        _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.DEPTH_STENCIL_ATTACHMENT, _gl.TEXTURE_2D, this.depth_buffer, 0);
    }

    /**
     * Bind the framebuffer
     */
    bind() {
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, this.framebuffer);
        _gl.bindTexture(_gl.TEXTURE_2D, this.color_buffer);
        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGB, _gl.canvas.width, _gl.canvas.height, 0, _gl.RGB, _gl.UNSIGNED_BYTE, null);

        _gl.bindTexture(_gl.TEXTURE_2D, this.depth_buffer);
        _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.DEPTH24_STENCIL8, _gl.canvas.width, _gl.canvas.height, 0, _gl.DEPTH_STENCIL, _gl.UNSIGNED_INT_24_8, null);
    }

    /**
     * Presents a framebuffer onto another. This does not use a specified shader.
     * You can specify manually the framebuffer to copy to, or you can leave it 
     * blank to display to the screen.
     * @param fb_copy 
     */
    present(fb_copy: WebGLFramebuffer | null = null) {
        _gl.bindFramebuffer(_gl.FRAMEBUFFER, fb_copy);
        
        yz_render_clear_color_int(255, 255, 255, 255);
        yz_render_clear();

        _gl.activeTexture(_gl.TEXTURE0);
        _gl.bindTexture(_gl.TEXTURE_2D, this.color_buffer);

        _gl.activeTexture(_gl.TEXTURE1);
        _gl.bindTexture(_gl.TEXTURE_2D, this.depth_buffer);

        _fb_model?.bind();
        _fb_model?.draw();

        _gl.activeTexture(_gl.TEXTURE0);
    }
}

/**
 * A post process layer consists of a framebuffer and attached shader.
 * This shader is loaded with post-process defaults and then used to present
 * onto another framebuffer, applying the shader effects.
 */
class PostProcessLayer {
    shaderName: string;
    outFB: Framebuffer;

    constructor(shaderName: string) {
        this.outFB = new Framebuffer();
        this.shaderName = shaderName;
    }

    /**
     * Processes the shader
     * @param inFB Incoming framebuffer with color data
     * @returns Returns this framebuffer output
     */
    doProcessing(inFB: Framebuffer) {
        this.outFB.bind();
        
        YZ_ShaderManager.set_current_shader(YZ_ShaderManager.lookup_id(this.shaderName) as number);
        YZ_ShaderManager.set_vec2("iRes", _gl.canvas.width, _gl.canvas.height);
        YZ_ShaderManager.set_int("tex0", 0);
        YZ_ShaderManager.set_int("tex1", 1);
        
        inFB.present(this.outFB.framebuffer);
        return this.outFB;
    }
}

/**
 * Post processing stack consists of post processes layers and applies
 * the layers in order. This starts with the initial render results
 * and then outputs the final result to be presented onto the screen.
 */
class PostProcessStack {
    private stack: PostProcessLayer[];

    constructor() {
        this.stack = new Array<PostProcessLayer>();
    }

    /**
     * Adds a post process layer
     * @param layer Layer to use
     */
    pushLayer(layer: PostProcessLayer) {
        this.stack.push(layer);
    }

    /**
     * Pops the latest layer on the stack.
     */
    popLayer() {
        this.stack.pop();
    }

    /**
     * Performs post processing stack, and outputs the result
     * @param inFB Incoming Render Pass Result
     * @returns Outcome of post processing
     */
    performPost(inFB: Framebuffer): Framebuffer {
        if(this.stack.length <= 0)
            return inFB;
        
        var resFB = this.stack[0].doProcessing(inFB);
        for(let i = 1; i < this.stack.length; i++) {
            resFB = this.stack[i].doProcessing(resFB);
        }

        return resFB;
    }
}

var YZ_PassManager : PassManager;

/**
 * Pass Manager is a class which handles the initial render pass
 * and the post processing stack. This is used to easily abstract the two.
 */
class PassManager {
    baseFB: Framebuffer;
    postProcessStack: PostProcessStack;

    constructor() {
        this.baseFB = new Framebuffer();
        this.postProcessStack = new PostProcessStack();
    }

    /**
     * Starts the render pass
     */
    startRenderPass() {
        _gl.enable(_gl.CULL_FACE);
        _gl.enable(_gl.DEPTH_TEST);
        this.baseFB.bind();
    }

    /**
     * Finishes rendering and presents to screen
     */
    doPostPresent() {
        _gl.disable(_gl.CULL_FACE);
        _gl.disable(_gl.DEPTH_TEST);
        var resFB = this.postProcessStack.performPost(this.baseFB);

        YZ_ShaderManager.set_current_shader(YZ_ShaderManager.lookup_id("present") as number);
        resFB.present();
    }
}