


class Scene {
    public sceneName: string = "Default";
    private objects: GameObject[] = [];

    /**
    * pushes the object into an array in scene, will return the index of the GameObject pushed
    * will change children's parent node automatically by calling addParent
    * @param object - the GameObject being pushed onto the array
    */
    addObject(object: GameObject) {
        object.addParent(this);
        this.objects.push(object);
        return this.objects.length - 1;
    }



    /**
     * Will Update the scene by updating all the GameObject added by addObject
     */
    update() {
        this.objects.forEach(a => { a.update() })
    }

    /**
     * Will Draw the scene by drawing all the GameObject added by addObject
     */
    draw() {
        this.objects.forEach(a => { a.draw() })
    }

    /**
    * returns a gameobject based on the index given, if index is out of bound then returns a new GameObject
    * and prints an error explaning what it got; index, the scene's name, and the amount of entries it has
    * @param index - index of the GameObject you're looking for
    */
    returnObject(index: number): GameObject {
        if (index < this.objects.length) {
            return this.objects[index];
        } else {
            console.log('Error, index out of bound at scene: ${this.sceneName} for index: ${index} with ${this.objects.length} entries');
            return new GameObject;
        }

    }

}

class GameObject {
    private objectName: String | null = null;
    private parent: Scene | GameObject | null = null;
    private children: GameObject[] = [];
    private components: Component[] = [];
    public model: any;
    public transform: any;

    /**
    * A helper function of changing parent node of the current GameObject, Scene will automatically call this when 
    * using addObject
    * @param parent (Scene | GameObject) - the node that is the parent node of this object
    */
    addParent(parent: Scene | GameObject): void {
        this.parent = parent;
    }

    /**
     * Change the name of the component
     * @param name - string to name the component
     */
    changeName(name: String): void {
        this.objectName = name;
    }

    /**
     * Add component onto a list
     * @param component - component to add to the GameObject
     */
    addComponent(component: Component): void {
        this.components.push(component);
    }

    /**
    * Add a gameObject to the list and also call addParent on the object being added
    * @param object - the Gameobject that's being added onto the list as a child to this node
    */
    addObject(object: GameObject) {
        object.addParent(this);
        this.children.push(object);
    }

    /**
    * Update gameobject and also update all children gameobject
    *
    */
    update() {
        // add actual updating of the model
        this.components.forEach(a => {a.update() });
        this.children.forEach(a => { a.update() });
    }

    /**
    * Draw Gameobject and also call draw on any children objects
    *
    */
    draw() {
        // add actual drawing of the model
        this.components.forEach(a => {a.draw() });
        this.children.forEach(a => { a.draw() });
    }
}

class Component{
    public onUpdate?: () => void
    public onDraw?: () => void
    public gameObject: GameObject|null = null;

    constructor() {}

    update() {
        // Base
        if(!this.onUpdate) return;
        this.onUpdate();
    }
    draw() {
        // Base
        if(!this.onDraw) return;
        this.onDraw();
    }
}

class MeshComponent extends Component {
    public name: String = ""
    public mesh: Mesh|null = null;
    constructor() {
        super();
        this.name = "Mesh";
    }
    
    update() {
        super.update();
    }
    
    draw() {
        if(this.mesh instanceof Mesh){
            this.mesh.draw();
        } 

        super.draw();
    }
    
}
