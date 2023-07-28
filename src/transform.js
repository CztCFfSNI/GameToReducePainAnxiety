/**
 * The Transform Object represents a single transformation to a world position.
 * Transforms may or may not be local, depending on how they are applied.
 * The transform describes a position, rotation, and scale. These are public properties.
 * After changing the position, rotation, scale, you MUST call update() for this to work.
 */
 class Transform {
    position;
    rotation;
    scale;
    matrix;
    quat;
    
    constructor() {
        this.position = glMatrix.vec3.fromValues(0, 0, 0);
        this.rotation = glMatrix.vec3.fromValues(0, 0, 0);
        this.scale = glMatrix.vec3.fromValues(1, 1, 1);

        var q = [];
        var m = [];
        this.quat = glMatrix.quat.fromEuler(q, this.rotation[0], this.rotation[1], this.rotation[2]);
        this.matrix = glMatrix.mat4.fromRotationTranslationScale(m, this.quat, this.position, this.scale);
    }

    /**
     * Updates the quaternion and model matrix
     */
    update() {
        this.quat = glMatrix.quat.fromEuler(this.quat, this.rotation[0], this.rotation[1], this.rotation[2]);
        this.matrix = glMatrix.mat4.fromRotationTranslationScale(this.matrix, this.quat, this.position, this.scale);
    }

    /**
     * Gets the transformation matrix
     * @returns Transformed model matrix
     */
    get_model_matrix() {
        return this.matrix;
    }
}

/**
 * Matrix Stack object. This contains the matrices that will be used for drawing.
 * The projection matrix is set as orthographic or perspective
 * The view matrix is set as the player's position in the world
 * The model matrix is set as the object's position in the world
 * Model matrices can be relative, and with each push to the stack we add another transform layer
 * This can be used for easily creating local spaces for transformation.
 */
class MatrixStack {
    orthographic;
    perspectivep;
    projection;
    view;
    model;
    result_matrix;

    constructor() {
        this.projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        this.orthographic = glMatrix.mat4.identity(glMatrix.mat4.create());
        this.perspectivep = glMatrix.mat4.identity(glMatrix.mat4.create());
        this.view = glMatrix.mat4.identity(glMatrix.mat4.create());
        this.model = [];
        this.model.push(glMatrix.mat4.identity(glMatrix.mat4.create()));
        this.result_matrix = glMatrix.mat4.identity(glMatrix.mat4.create());
    }

    /**
     * Creates an orthographic projection matrix
     * @param {*} left Left Limit
     * @param {*} right Right Limit
     * @param {*} bottom Bottom Limit
     * @param {*} top Top Limit
     * @param {*} zN Z Near Limit
     * @param {*} zF Z Far Limit 
     */
    ortho(left, right, bottom, top, zN, zF) {
        this.orthographic = glMatrix.mat4.ortho(glMatrix.mat4.create(), left, right, bottom, top, zN, zF);
    }

    /**
     * Creates a perspective projection matrix
     * @param {*} fovy FOV angle
     * @param {*} aspect Aspect Ratio
     * @param {*} zn Z Near Limit
     * @param {*} zf Z Far Limit
     */
    perspective(fovy, aspect, zn, zf) {
        this.perspectivep = glMatrix.mat4.perspective(glMatrix.mat4.create(), fovy / 180.0 * 3.14159, aspect, zn, zf);
    }

    /**
     * Set the projection matrix to 2D Mode
     */
    set_mode_2D() {
        this.projection = this.orthographic;
    }
    
    /**
     * Set the projection matrix to 3D Mode
     */
    set_mode_3D() {
        this.projection = this.perspectivep;
    }

    /**
     * Updates the resulting matrix of the multiplication.
     * This can be done manually, but occurs on push and pop as well.
     */
    update_matrix() {
        this.result_matrix = glMatrix.mat4.identity(glMatrix.mat4.create());

        for(let i = 0; i < this.model.length; i++) {
            glMatrix.mat4.multiply(this.result_matrix, this.result_matrix, this.model[i]);
        }
    }

    /**
     * Pushes a new matrix onto the stack and updates result matrix
     * @param matrix Matrix to be pushed
     */
    push_model(matrix) {
        this.model.push(matrix);
        this.update_matrix();
    }

    /**
     * Pops a matrix off the stack and updates the result matrix
     */
    pop_model() {
        this.model.pop();
        this.update_matrix();
    }
}

var YZ_MatrixStack = new MatrixStack();
