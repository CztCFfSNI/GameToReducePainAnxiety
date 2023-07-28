var _gl : WebGL2RenderingContext;
var YZ_ShaderManager : ShaderManager;
var YZ_TextureManager : TextureManager;
var YZ_LightManager: LightManager;
var _canvas : HTMLCanvasElement;

/**
 * Returns an error in console and displays a message to the user
 * TODO: Remove alert() so that consecutive errors do not occur to user
 * NOTE: This may cause some platforms to block these alert requests
 * @param msg Message of the error that has been reported.
 */
function yz_error(msg: string): void {
    console.error(msg);
    alert(msg);
}

/**
 * Initializes the WebGL rendering context on a canvas with an ID name of "main-canvas"
 * This sets up a WebGL2 context specifically, and the context can be accessed by _gl
 * _gl is chosen to not collide with any userspace created contexts.
 */
function yz_render_init_context(): void {
    _canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
    var _glc = _canvas.getContext("webgl2", {antialias: false}); 

    if(!_glc) {
        yz_error("Error: No WebGL2 Context!");
        return;
    }

    _gl = _glc as WebGL2RenderingContext;

    YZ_ShaderManager = new ShaderManager();
    YZ_TextureManager = new TextureManager();
    YZ_MatrixStack = new MatrixStack();
    YZ_LightManager = new LightManager();

    YZ_DefaultColorMaterial = new Material();
    YZ_DefaultColorMaterial.texture_id = 0;
    YZ_DefaultColorMaterial.shader_id = YZ_ShaderManager.add_shader("basic_col", vs, fs);
    YZ_DefaultColorMaterial.settings.set("noTex", {type: ValueType.Int, value: 1});
    YZ_DefaultColorMaterial.bind();

    YZ_DefaultTextureMaterial = new Material();
    YZ_DefaultTextureMaterial.texture_id = 0;
    YZ_DefaultTextureMaterial.shader_id = YZ_ShaderManager.add_shader("basic_tex", vs, fs);
    YZ_DefaultTextureMaterial.bind();

    YZ_ShaderManager.add_shader("phong", _phong_vs, _phong_fs);
    YZ_PhongMaterial = new PhongMaterial();
    YZ_PhongMaterial.bind();

    YZ_ShaderManager.add_shader("lambert", _lambert_vs, _lambert_fs);
    YZ_LambertMaterial = new LambertMaterial();
    YZ_LambertMaterial.bind();

    YZ_ShaderManager.add_shader("phong_toon", _phong_toon_vs, _phong_toon_fs);
    YZ_PhongToonMaterial = new PhongToonMaterial();
    YZ_PhongToonMaterial.bind();

    YZ_ShaderManager.add_shader("lambert_toon", _lambert_toon_vs, _lambert_toon_fs);
    YZ_LambertToonMaterial = new LambertToonMaterial();
    YZ_LambertToonMaterial.bind();

    YZ_PassManager = new PassManager();

    YZ_ShaderManager.add_shader("present", _base_vs, _base_fs);
    YZ_ShaderManager.add_shader("bloom", _base_vs, _bloom_fs);
    YZ_ShaderManager.add_shader("edge", _base_vs, _edge_fs);
    YZ_ShaderManager.add_shader("fxaa", _fxaa_vs, _fxaa_fs);

    _gl.enable(_gl.DEPTH_TEST);
    _gl.enable(_gl.CULL_FACE);
    _gl.depthFunc(_gl.LESS);
    _gl.cullFace(_gl.BACK);
    _gl.frontFace(_gl.CCW);

    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.SRC_ALPHA, _gl.ONE_MINUS_SRC_ALPHA);

    YZ_Camera = new Camera();
    YZ_FontRenderer = new FontRenderer();
}

/**
 * Sets a clear color using hex values from 0-255
 * @param r Red component
 * @param g Green component
 * @param b Blue component
 * @param a Alpha component
 */
function yz_render_clear_color_int(r: number, g: number, b: number, a: number): void {
    _gl.clearColor(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
}

/**
 * Sets a clear color using float values from 0.0-1.0
 * @param r Red component
 * @param g Green component
 * @param b Blue component
 * @param a Alpha component
 */
function yz_render_clear_color_float(r: number, g: number, b: number, a: number): void {
    _gl.clearColor(r, g, b, a);
}

/**
 * Resizes a canvas based on new window height / width
 * @param canvas Canvas to resize upon
 * @returns Returns whether or not a resize has occurred
 */
function resizeCanvasToDisplaySize(canvas: any) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
   
    // Check if the canvas is not the same size.
    const needResize = canvas.width  !== displayWidth ||
                       canvas.height !== displayHeight;
   
    if (needResize) {
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
   
    return needResize;
  }

/**
 * Clears the screen and sets the viewport
 */
function yz_render_clear(): void {
    resizeCanvasToDisplaySize(_gl.canvas);
    _gl.viewport(0, 0, _gl.canvas.width, _gl.canvas.height);
    _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
}

/**
 * Shaders in the way we describe them are programs that accept vertex data,
 * alongside of uniform (constant) data and are used per object drawcall.
 * These shaders modify the vertex data (locally) and convert them into fragments (pixels)
 * that are then outputted to the framebuffer (the screen for now)
 * 
 * Shader programs are written in GLSL (GL Shading Language), and we are using GLES 3.0 compatible
 * shaders as our standard. This is seen by the first line `#version 300 es` in our programs
 */
class Shader {
    programID: WebGLProgram;

    /**
     * This method attempts to compile a shader object from a source and a type
     * @param ss The string that describes our shader program source code
     * @param type The type of shader, either _gl.VERTEX_SHADER or _gl.FRAGMENT_SHADER
     * @returns WebGLShader object on success or prints an error and returns null.
     */
    private compile(ss: string, type: number) : WebGLShader | null {
        var temp = _gl.createShader(type);

        if(temp == null) {
            yz_error("Failed to create shader!");
            return null;
        }

        _gl.shaderSource(temp, ss);
        _gl.compileShader(temp);

        const message = _gl.getShaderInfoLog(temp);
        if(message != null && message.length > 0) {
            yz_error("Failed to compile shader: " + message);
            return null;
        }

        return temp;
    }

    /**
     * Constructs a shader program from a vertex and fragment source code
     * @param vs Vertex Shader Source Code
     * @param fs Fragment Shader Source Code
     */
    constructor(vs: string, fs: string) {
        var vertShader = this.compile(vs, _gl.VERTEX_SHADER);
        var fragShader = this.compile(fs, _gl.FRAGMENT_SHADER);

        var prog = _gl.createProgram();
        if(vertShader == null || fragShader == null || prog == null) {
            yz_error("Failed to make shader program!");
        }

        this.programID = prog as WebGLShader;

        _gl.attachShader(this.programID, vertShader as WebGLShader);
        _gl.attachShader(this.programID, fragShader as WebGLShader);

        _gl.linkProgram(this.programID);

        const message = _gl.getProgramInfoLog(this.programID);
        if(message != null && message.length > 0) {
            yz_error("Failed to link shader program: " + message);
        }

        _gl.deleteShader(vertShader);
        _gl.deleteShader(fragShader);
    }

    /**
     * Bind the current shader slot
     */
    public bind(): void {
        _gl.useProgram(this.programID);
    }

    /**
     * Unbind the current shader slot
     */
    public unbind(): void {
        _gl.useProgram(null);
    }

    /**
     * Gets the location of a uniform variable to update
     * @param str Name of the uniform variable
     * @returns Returns either the location or null if not found
     */
    public get_uniform_location(str: string) {
        return _gl.getUniformLocation(this.programID, str);
    }

    /**
     * Sets the respective shader uniform to the integer value
     * @param location Uniform location
     * @param value Value to insert
     */
    public set_int(location: WebGLUniformLocation | null, value: number) {
        _gl.uniform1i(location, value);
    }
    
    /**
     * Sets the respective shader uniform to the floating point value
     * @param location Uniform location
     * @param value Value to insert
     */
    public set_float(location: WebGLUniformLocation | null, value: number) {
        _gl.uniform1f(location, value);
    }

    public set_matrix(location: WebGLUniformLocation | null, value: any) {
        _gl.uniformMatrix4fv(location, false, value);
    }

    public set_vec2(location: WebGLUniformLocation | null, x: number, y: number) {
        _gl.uniform2f(location, x, y);
    }
    
    public set_vec3(location: WebGLUniformLocation | null, x: number, y: number, z: number) {
        _gl.uniform3f(location, x, y, z);
    }
}

/**
 * Shader Manager class holds a list of currently available shaders and a map of their names and IDs
 * It can have one shader bound at once and methods can be performed upon this currently enabled shader
 * in order to set the uniform properties of the shader. This is useful for things like Materials which
 * will be swapped, and being able to set basic properties like the PMV matrices without needing a material
 * reference in order to do so.
 */
 class ShaderManager {
    id_name_map: Map<string, number>;
    shader_list: Array<Shader>;
    current_shader: Shader | null;

    constructor() {
        this.shader_list = new Array<Shader>(0);
        this.id_name_map = new Map<string, number>();
        this.current_shader = null;
    }

    /**
     * Adds a new shader to the manager
     * @param name Name of the shader program
     * @param vs Vertex Shader Source
     * @param fs Fragment Shader Source
     * @returns Returns an ID number
     */
    add_shader(name: string, vs: string, fs: string): number {
        var id = this.shader_list.push(new Shader(vs, fs));
        this.id_name_map.set(name, id);
        return id;
    }

    /**
     * Tries to find a shader by a given name
     * @param name Name of the shader you want
     * @returns Returns an ID number or undefined on failure
     */
    lookup_id(name: string): number | undefined {
        return this.id_name_map.get(name);
    }

    /**
     * Returns a reference to a shader by an ID
     * @param id ID of the shader you want
     * @returns Returns the shader or undefined on failure
     */
    get_shader(id: number): Shader | undefined {
        return this.shader_list[id - 1];
    }
     
    /**
     * Sets the current shader to a given ID
     * @param id ID of the shader to switch in
     */
    set_current_shader(id: number) : void {
        var shad = this.shader_list[id - 1];
        this.current_shader = shad;

        if(this.current_shader != null)
            this.current_shader.bind();
    }

    /**
     * Sets the uniform property to an integer value
     * @param name Name of the uniform property
     * @param value Integer Value
     */
    set_int(name: string, value: number) : void {
        if(this.current_shader == null)
            return;
        this.current_shader.set_int(this.current_shader.get_uniform_location(name), value);
    }

    /**
     * Sets the uniform property to a floating point value
     * @param name Name of the uniform property
     * @param value Float Value
     */
    set_float(name: string, value: number) : void {
        if(this.current_shader == null)
            return;
        this.current_shader.set_float(this.current_shader.get_uniform_location(name), value);
    }

    set_matrix(name: string, value: any) : void {
        if(this.current_shader == null)
            return;
        this.current_shader.set_matrix(this.current_shader.get_uniform_location(name), value);
    }

    set_vec2(name: string, x: number, y: number) {
        if(this.current_shader == null)
            return;
        this.current_shader.set_vec2(this.current_shader.get_uniform_location(name), x, y);
    }
    
    set_vec3(name: string, x: number, y: number, z: number) {
        if(this.current_shader == null)
            return;
        this.current_shader.set_vec3(this.current_shader.get_uniform_location(name), x, y, z);
    }
}

/**
 * Texture Manager is responsible for the loading of textures and stores them in an indexed array
 * They also contain a map of names and identifiers. It can be used to load any texture with an ID 
 * and assign it to a given texture module.
 */
class TextureManager {
    id_name_map: Map<string, number>;
    texture_list: Array<WebGLTexture>;

    constructor() {
        this.texture_list = new Array<WebGLTexture>(0);
        this.id_name_map = new Map<string, number>();
    }

    /**
     * Loads a texture
     * @param name Name of the texture
     * @param url URL Link to the texture file
     * @param wrap Texture Wrapping Mode
     * @param magF Mag Filter
     * @param minF Min Filter
     * @returns 
     */
    load_texture(name: string, url: string, wrap: number, magF: number, minF: number): number {
        var image = new Image();
        image.src = url;

        var tex = _gl.createTexture();
        if(tex == null) {
            yz_error("Failed to load texture: " + url);
            return -1;
        }

        image.crossOrigin = "anonymous";
        image.onload = () => {
            _gl.bindTexture(_gl.TEXTURE_2D, tex);
            _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.SRGB8_ALPHA8, image.width, image.height, 0, _gl.RGBA, _gl.UNSIGNED_BYTE, image);

            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, magF);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, minF);
        
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, wrap);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, wrap);

            _gl.generateMipmap(_gl.TEXTURE_2D);
        };

        var id = this.texture_list.push(tex as WebGLTexture);
        this.id_name_map.set(name, id);
        return id;
    }

    /**
     * Lookup ID by name of the texture
     * @param name Name of the texture
     * @returns Texture ID or undefined if not found
     */
    lookup_id(name: string): number | undefined {
        return this.id_name_map.get(name);
    }

    /**
     * Bind a texture to a texture module
     * @param id Identifier for the texture to find
     * @param tm Texture Module Number (_gl.TEXTURE_2D default)
     */
    bind_texture(id: number, tm: number = _gl.TEXTURE_2D): void {
        _gl.bindTexture(tm, this.texture_list[id - 1]);
    }
}

/**
 * Value Types -- this is used for describing the data stored in enums
 */
enum ValueType {
    Int,
    Float,
    Vector2,
    Vector3
};

/**
 * Value structure -- type + data
 */
class Value {
    type: ValueType;
    value: any;

    constructor() {
        this.type = ValueType.Float;
    }
}

/**
 * Material is a structure which simplifies the usage of shaders and textures, combines a shader ID and texture ID
 * which are used to bind the material. This structure contains a settings map with named keys, values, and value types
 * which are then passed into a shader.
 */
class Material {
    public shader_id: number;
    public texture_id: number;
    public settings: Map<string, Value>;
    public color: [number, number, number] = [1.0, 1.0, 1.0];

    constructor() {
        this.shader_id = 0;
        this.texture_id = 0;
        this.settings = new Map<string, Value>();
    }

    /**
     * Binds the material shader and material
     * Also applies all the uniform settings withing the material
     */
    bind() {
        YZ_ShaderManager.set_current_shader(this.shader_id);
        YZ_TextureManager.bind_texture(this.texture_id);

        YZ_ShaderManager.set_vec3("material.color", this.color[0], this.color[1], this.color[2]);

        for(let [key, value] of this.settings) {
            if(value.type == ValueType.Float) {
                YZ_ShaderManager.set_float(key, value.value);
            } else if (value.type == ValueType.Vector2) {
                YZ_ShaderManager.set_vec2(key, value.value[0], value.value[1]);
            } else if (value.type == ValueType.Vector3) {
                YZ_ShaderManager.set_vec3(key, value.value[0], value.value[1], value.value[2]);
            } else {
                YZ_ShaderManager.set_int(key, value.value);
            }
        }
    }
}

/**
 * The mesh class is a massive abstraction over the vertex buffer object (VBO) system
 * and the vertex array object (VAO) systems. This abstraction removes the need for
 * manual creation of VAO and VBOs. This can then be bound to the current VAO slot 
 * and drawn to the screen.
 */
class Mesh {
    public vao : WebGLVertexArrayObject | null;

    private vert_buf: WebGLBuffer | null;
    private col_buf: WebGLBuffer | null;
    private norm_buf: WebGLBuffer | null;
    private tex_buf: WebGLBuffer | null;
    private idx_buf: WebGLBuffer | null;

    public vert_array: Float32Array;
    public col_array: Float32Array;
    public norm_array: Float32Array;
    public tex_array: Float32Array;
    public idx_array: Int16Array;

    constructor() {
        this.vao = null;
        this.vert_buf = null;
        this.col_buf = null;
        this.norm_buf = null;
        this.tex_buf = null;
        this.idx_buf = null;

        this.vert_array = new Float32Array(0);
        this.col_array = new Float32Array(0);
        this.norm_array = new Float32Array(0);
        this.tex_array = new Float32Array(0);
        this.idx_array = new Int16Array(0);
    }

    /**
     * Sets up a mesh object (VAO) and buffer objects (VBOs)
     */
    setup_mesh() {
        if(this.vao == null) {
            this.vao = _gl.createVertexArray();
        }
        _gl.bindVertexArray(this.vao);

        if(this.vert_buf == null) {
            this.vert_buf = _gl.createBuffer();
        }
        
        if(this.col_buf == null) {
            this.col_buf = _gl.createBuffer();
        }
        
        if(this.norm_buf == null) {
            this.norm_buf = _gl.createBuffer();
        }
        
        if(this.tex_buf == null) {
            this.tex_buf = _gl.createBuffer();
        }

        if(this.idx_buf == null) {
            this.idx_buf = _gl.createBuffer();
        }

        _gl.enableVertexAttribArray(0);
        _gl.enableVertexAttribArray(1);
        _gl.enableVertexAttribArray(2);
        _gl.enableVertexAttribArray(3);

        _gl.bindBuffer(_gl.ARRAY_BUFFER, this.vert_buf);
        _gl.bufferData(_gl.ARRAY_BUFFER, this.vert_array, _gl.STATIC_DRAW);
        _gl.vertexAttribPointer(0, 3, _gl.FLOAT, false, 0, 0);

        _gl.bindBuffer(_gl.ARRAY_BUFFER, this.col_buf);
        _gl.bufferData(_gl.ARRAY_BUFFER, this.col_array, _gl.STATIC_DRAW);
        _gl.vertexAttribPointer(1, 4, _gl.FLOAT, false, 0, 0);

        _gl.bindBuffer(_gl.ARRAY_BUFFER, this.norm_buf);
        _gl.bufferData(_gl.ARRAY_BUFFER, this.norm_array, _gl.STATIC_DRAW);
        _gl.vertexAttribPointer(2, 3, _gl.FLOAT, false, 0, 0);

        _gl.bindBuffer(_gl.ARRAY_BUFFER, this.tex_buf);
        _gl.bufferData(_gl.ARRAY_BUFFER, this.tex_array, _gl.STATIC_DRAW);
        _gl.vertexAttribPointer(3, 2, _gl.FLOAT, false, 0, 0);

        _gl.bindBuffer(_gl.ELEMENT_ARRAY_BUFFER, this.idx_buf);
        _gl.bufferData(_gl.ELEMENT_ARRAY_BUFFER, this.idx_array, _gl.STATIC_DRAW);

        _gl.bindVertexArray(null);
    }

    /**
     * Binds the mesh as the current mesh to be drawn
     */
    bind() {
        _gl.bindVertexArray(this.vao);
    }

    /**
     * Draws the mesh to the screen
     */
    draw() {
        _gl.drawElements(_gl.TRIANGLES, this.idx_array.length, _gl.UNSIGNED_SHORT, 0);
    }
}

/**
 * The model class is merely an abstraction which exists to cover translation
 * material, matrix stack, and drawing issues. The model consists of a mesh,
 * a material, and a transform. The material applies the shading and the texture,
 * the transform applies the transformation relative to previous worldspace, and
 * the mesh handles the drawing.
 */
class Model {
    public mesh: Mesh;
    public material: Material;
    public transform: Transform;

    constructor() {
        this.mesh = new Mesh();
        this.material = new Material();
        this.transform = new Transform();
    }

    async loadOBJ(filename: string) {
        this.mesh = await loadModelInternal(filename);
    }

    /**
     * Draws the model onto the screen with the given settings.
     */
    draw() {
        this.mesh.bind();
        this.material.bind();

        YZ_ShaderManager.set_matrix("m_proj", YZ_MatrixStack.projection);
        YZ_ShaderManager.set_matrix("m_view", YZ_MatrixStack.view);

        YZ_MatrixStack.push_model(this.transform.get_model_matrix());
        YZ_ShaderManager.set_matrix("m_model", YZ_MatrixStack.result_matrix);
        YZ_MatrixStack.pop_model();

        YZ_LightManager.bindLights();

        this.mesh.draw();
    }
}

/// Materials

/**
 * Material extension using Phong Shading
 */
class PhongMaterial extends Material {
    public ambient: number = 0.1;
    public diffuse: number = 0.8;
    public specular: number = 0.6;
    public shininess: number = 5;

    constructor() {
        super();
        this.shader_id = YZ_ShaderManager.lookup_id("phong") as number;
        this.texture_id = 0;
    }

    bind() {
        super.bind();
        this.settings.set("material.ambientStrength", {type: ValueType.Float, value: this.ambient});
        this.settings.set("material.diffuseStrength", {type: ValueType.Float, value: this.diffuse});
        this.settings.set("material.specularStrength", {type: ValueType.Float, value: this.specular}); 
        this.settings.set("material.shininess", {type: ValueType.Float, value: this.shininess});    
    }
}

/**
 * Material extension using Lambert Shading
 */
class LambertMaterial extends Material {
    public ambient: number = 0.1;
    public diffuse: number = 0.9;

    constructor() {
        super();
        this.shader_id = YZ_ShaderManager.lookup_id("lambert") as number;
        this.texture_id = 0;
    }

    bind() {
        super.bind();
        this.settings.set("material.ambientStrength", {type: ValueType.Float, value: this.ambient});
        this.settings.set("material.diffuseStrength", {type: ValueType.Float, value: this.diffuse});
    }
}

/**
 * Material extension using Phong Shading with Cel-Shading
 */
class PhongToonMaterial extends Material {
    public ambient: number = 0.1;
    public diffuse: number = 0.8;
    public specular: number = 0.6;
    public shininess: number = 5;

    constructor() {
        super();
        this.shader_id = YZ_ShaderManager.lookup_id("phong_toon") as number;
        this.texture_id = 0;
    }

    bind() {
        super.bind();
        this.settings.set("material.ambientStrength", {type: ValueType.Float, value: this.ambient});
        this.settings.set("material.diffuseStrength", {type: ValueType.Float, value: this.diffuse});
        this.settings.set("material.specularStrength", {type: ValueType.Float, value: this.specular}); 
        this.settings.set("material.shininess", {type: ValueType.Float, value: this.shininess});    
    }
}

/**
 * Material extension using Lambert Shading with Cel-Shading
 */
class LambertToonMaterial extends Material {
    public ambient: number = 0.1;
    public diffuse: number = 0.9;

    constructor() {
        super();
        this.shader_id = YZ_ShaderManager.lookup_id("lambert_toon") as number;
        this.texture_id = 0;
    }

    bind() {
        super.bind();
        this.settings.set("material.ambientStrength", {type: ValueType.Float, value: this.ambient});
        this.settings.set("material.diffuseStrength", {type: ValueType.Float, value: this.diffuse});
    }
}

/// Lighting

/**
 * Type of the light
 */
enum LightType {
    Directional = 0, //Directional is global
    Point = 1//Point is local
}

/**
 * Attributes of various lights including position, type, color, and intensity.
 * Optionally if Directional -- Direction is used and position is ignored.
 * Optionally if Point -- Distance is used for attenuation.
 */
class Light {
    public lightType: LightType = LightType.Point;
    public position: number[] = [0, 0, 0];
    public color: number[] = [1, 1, 1];
    public intensity: number = 1.0;
 
    //Optional - Direction
    public direction: number[] = [0, 0, 0];

    //Optional - Point
    public distance: number = 10.0;

    constructor(type: LightType, pos: number[], col: number[], int: number, dir: number[], dist: number) {
        this.lightType = type;
        this.position = pos;
        this.color = col;
        this.intensity = int;
        this.direction = dir;
        this.distance = dist;
    }
}

class LightManager {
    private lights: Light[] = [];
    public ambientColor: number[] = [0.5, 0.5, 0.5];

    addLight(light: Light): number {
        this.lights.push(light);
        return this.lights.length - 1;
    }

    removeLight(idx: number): void {
        this.lights.splice(idx, 1);
    }

    private bindLight(l: Light, idx: number): void {
        if(l == undefined)
            return;
        YZ_ShaderManager.set_int("light[" + idx + "].type", l.lightType as number);
        YZ_ShaderManager.set_vec3("light[" + idx + "].position", l.position[0], l.position[1], l.position[2]);
        YZ_ShaderManager.set_vec3("light[" + idx + "].direction", l.direction[0], l.direction[1], l.direction[2]);
        YZ_ShaderManager.set_vec3("light[" + idx + "].color", l.color[0], l.color[1], l.color[2]);
        YZ_ShaderManager.set_float("light[" + idx + "].intensity", l.intensity);
        YZ_ShaderManager.set_float("light[" + idx + "].distance", l.distance);
    }

    bindLights(): void {
        for(var i = 0; i < this.lights.length; i++) {
            this.bindLight(this.lights[i], i);
        }
        YZ_ShaderManager.set_int("lightCount", this.lights.length);
        YZ_ShaderManager.set_vec3("ambientColor", this.ambientColor[0], this.ambientColor[1], this.ambientColor[2]);

        //TODO: Must be changed with camera
        YZ_ShaderManager.set_vec3("viewPos", 0, 0, 0);
    }
}

/// Camera class

var YZ_Camera : Camera;

class Camera {
    public transform: Transform;

    public fov: number = 90;
    public zNear: number = 0.3;
    public zFar: number = 128;

    constructor() {
        this.transform = new Transform();
    }

    update() {
        var canv = _gl.canvas as HTMLCanvasElement;
        var aspect = canv.clientWidth / canv.clientHeight;
        YZ_MatrixStack.perspective(this.fov, aspect, this.zNear, this.zFar);

        this.transform.update();
        YZ_MatrixStack.view = this.transform.get_model_matrix();
        YZ_MatrixStack.set_mode_3D();
    }
};

var YZ_FontRenderer : FontRenderer;

class FontRenderer {
    private tCanv : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;

    constructor() {
        this.tCanv = document.querySelector("#text") as HTMLCanvasElement;
        this.ctx = this.tCanv.getContext("2d") as CanvasRenderingContext2D;
    }

    beginDraw() {
        const width  = this.ctx.canvas.clientWidth;
        const height = this.ctx.canvas.clientHeight;
        if (this.ctx.canvas.width !== width || this.ctx.canvas.height !== height) {
            this.ctx.canvas.width  = width;
            this.ctx.canvas.height = height;
        }
    
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
        this.ctx.scale(1, 1);
        this.ctx.font = "36px Atkinson Hyperlegible";
    }

    drawText(align: CanvasTextAlign, text: string, position: number[], style: string = "black") {
        this.ctx.textAlign = align;
        this.ctx.fillStyle = style;
        this.ctx.fillText(text, position[0] * this.ctx.canvas.width, position[1] * this.ctx.canvas.height);
    }
}

class Sprite {
    spriteModel : Model

    constructor(tex: number, x: number, y: number, w: number, h: number) {
        this.spriteModel = new Model();
        this.spriteModel.material = new Material();
        this.spriteModel.material.shader_id = YZ_ShaderManager.lookup_id("basic_tex") as number;
        this.spriteModel.material.texture_id = tex;
        this.spriteModel.mesh = new Mesh();

        this.update_sprite(x, y, w, h);
    }

    update_sprite(x: number, y: number, w: number, h: number) {
        this.spriteModel.mesh.vert_array = new Float32Array([
            x, y, 0.0,
            x, y+h, 0.0,
            x+w, y+h, 0.0,
            x+w, y, 0.0
        ]);
        this.spriteModel.mesh.col_array = new Float32Array([
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
        ]);
        this.spriteModel.mesh.norm_array = new Float32Array([
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0
        ]);
        this.spriteModel.mesh.tex_array = new Float32Array([
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
        ]);
        this.spriteModel.mesh.idx_array = new Int16Array([0, 1, 2, 2, 3, 0]);
        this.spriteModel.mesh.setup_mesh();
    }

    draw() {
        this.spriteModel.draw()
    }
}



class AnimatedSprite extends Sprite {
    atlas : [number, number]
    currentIdx : number
    xywh : [number, number, number, number]

    constructor(tex: number, x: number, y: number, w: number, h: number, tx: number, ty: number) {
        super(tex, x, y, w, h)
        this.atlas = [tx, ty]
        this.currentIdx = 0
        this.xywh = [x, y, w, h]
        this.update_sprite_a();
    }

    update_sprite_a() {
        var x = this.xywh[0]
        var y = this.xywh[1]
        var w = this.xywh[2]
        var h = this.xywh[3]

        this.spriteModel.mesh.vert_array = new Float32Array([
            x, y, 0.0,
            x, y+h, 0.0,
            x+w, y+h, 0.0,
            x+w, y, 0.0
        ]);
        this.spriteModel.mesh.col_array = new Float32Array([
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
        ]);
        this.spriteModel.mesh.norm_array = new Float32Array([
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0
        ]);

        var tx = this.currentIdx % this.atlas[0]
        var ty = Math.trunc(this.currentIdx / this.atlas[0])

        var tw = 1.0 / this.atlas[0]
        var th = 1.0 / this.atlas[1]

        this.spriteModel.mesh.tex_array = new Float32Array([
            tx * tw, ty * th,
            tx * tw, ty * th + th,
            tx * tw + tw, ty * th + th,
            tx * tw + tw, ty * th,
        ]);
        this.spriteModel.mesh.idx_array = new Int16Array([0, 1, 2, 2, 3, 0]);
        this.spriteModel.mesh.setup_mesh();
    }

    tick() {
        this.currentIdx++

        if(this.currentIdx >= this.atlas[0] * this.atlas[1]) {
            this.currentIdx = 0;
        }
        
        this.update_sprite_a();
    }

    draw() {
        this.spriteModel.draw()
    }
}