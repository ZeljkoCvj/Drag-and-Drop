"use strict";
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus[ProjectStatus["Active"] = 0] = "Active";
    ProjectStatus[ProjectStatus["Finished"] = 1] = "Finished";
})(ProjectStatus || (ProjectStatus = {}));
class Projects {
    constructor(id, title, description, numofpeopel, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.numofpeopel = numofpeopel;
        this.status = status;
    }
}
class ProjectState {
    constructor() {
        this.projects = [];
        this.listeners = [];
    }
    static GetInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }
    addListeners(listenerFN) {
        this.listeners.push(listenerFN);
    }
    addProjects(title, description, numofpeople) {
        const newProjects = new Projects(Math.random().toString(), title, description, numofpeople, ProjectStatus.Active);
        this.projects.push(newProjects);
        for (const listenerFN of this.listeners) {
            listenerFN(this.projects.slice());
        }
    }
    moveProject(projectId, newStatus) {
        const projectss = this.projects.find(prj => prj.id === projectId);
        if (projectss) {
            projectss.status = newStatus;
            this.uppdateListeners();
        }
    }
    uppdateListeners() {
        for (const listenerFN of this.listeners) {
            listenerFN(this.projects.slice());
        }
    }
}
const projectState = ProjectState.GetInstance();
function validate(validateInput) {
    let isValid = true;
    if (validateInput.required) {
        isValid = isValid && validateInput.value.toString().trim().length !== 0;
    }
    if (validateInput.minLength != null && typeof validateInput.value === "string") {
        isValid = isValid && validateInput.value.length > validateInput.minLength;
    }
    if (validateInput.maxLength != null && typeof validateInput.value === "string") {
        isValid = isValid && validateInput.value.length < validateInput.maxLength;
    }
    if (validateInput.min != null && typeof validateInput.value === "number") {
        isValid = isValid && validateInput.value > validateInput.min;
    }
    if (validateInput.max != null && typeof validateInput.value === "number") {
        isValid = isValid && validateInput.value < validateInput.max;
    }
    return isValid;
}
class Component {
    constructor(templateElementId, hostElementId, insertAtStart, newElID) {
        this.templateElement = document.getElementById(templateElementId);
        this.hostElement = document.getElementById(hostElementId);
        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = importedNode.firstElementChild;
        if (newElID) {
            this.element.id = newElID;
        }
        this.attach(insertAtStart);
    }
    attach(insertAtStart) {
        this.hostElement.insertAdjacentElement(insertAtStart ? "afterbegin" : "beforeend", this.element);
    }
}
class ProjectItem extends Component {
    get persons() {
        if (this.project.numofpeopel === 1) {
            return '1 persons';
        }
        else {
            return `${this.project.numofpeopel} persons `;
        }
    }
    constructor(hostId, project) {
        super("single-project", hostId, false, project.id);
        this.project = project;
        this.configure();
        this.renderContent();
    }
    dragStartHendler(event) {
        event.dataTransfer.setData("text/plain", this.project.id);
        event.dataTransfer.effectAllowed = "move";
    }
    dragEndHendler(event) {
        console.log("dropable");
    }
    configure() {
        this.element.addEventListener("dragstart", this.dragStartHendler.bind(this));
        this.element.addEventListener("dragend", this.dragEndHendler.bind(this));
    }
    renderContent() {
        this.element.querySelector("h2").textContent = this.project.title;
        this.element.querySelector("h3").textContent = this.persons + "assigned";
        this.element.querySelector("p").textContent = this.project.description;
    }
}
class ProjectList extends Component {
    constructor(type) {
        super('project-list', 'app', false, `${type}-projects`);
        this.type = type;
        /* this.templateElement = document.getElementById('project-list')! as HTMLTemplateElement;
         this.hostElement = document.getElementById('app')! as HTMLDivElement;
         
         const importedNode = document.importNode(this.templateElement.content,true );
         this.element = importedNode.firstElementChild as HTMLElement;
         this.element.id = `${this.type}-projects`;*/
        this.assignedProject = [];
        /* projectState.addListeners((project:Projects[])=>{
           const relevantProject = project.filter( prj =>{
              if(this.type === "active"){
               return  prj.status=== ProjectStatus.Active;
              }
              return prj.status === ProjectStatus.Finished;
           });
          this.assignedProject = relevantProject;
          this.renderProject();
        });*/
        this.renderContect();
        this.configure();
        // this.attach();
    }
    renderProject() {
        const lisetEl = document.getElementById(`${this.type}-projects-list`);
        lisetEl.innerHTML = "";
        for (const prjItem of this.assignedProject) {
            /*const listItem = document.createElement("ul");
            listItem.textContent = prjItem.title;
            lisetEl.appendChild(listItem);*/
            new ProjectItem(this.element.querySelector("ul").id, prjItem);
        }
    }
    dragOverHendler(event) {
        if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
            event.preventDefault();
            const listEl = this.element.querySelector("ul");
            listEl.classList.add("droppable");
        }
    }
    dragLeaveHendler(_) {
        const listEl = this.element.querySelector("ul");
        listEl.classList.remove("droppable");
    }
    dragHendler(event) {
        //console.log(event.dataTransfer!.getData("text/plain"));
        const prjid = event.dataTransfer.getData("text/plain");
        projectState.moveProject(prjid, this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished);
    }
    configure() {
        this.element.addEventListener("dragover", this.dragOverHendler.bind(this));
        this.element.addEventListener("dragleave", this.dragLeaveHendler.bind(this));
        this.element.addEventListener("drop", this.dragHendler.bind(this));
        projectState.addListeners((project) => {
            const relevantProject = project.filter(prj => {
                if (this.type === "active") {
                    return prj.status === ProjectStatus.Active;
                }
                return prj.status === ProjectStatus.Finished;
            });
            this.assignedProject = relevantProject;
            this.renderProject();
        });
    }
    renderContect() {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector("ul").id = listId;
        this.element.querySelector("h2").textContent = this.type.toUpperCase() + " PROJECTS";
    }
    renderContent() {
    }
}
class ProjectInput extends Component {
    //pozvali te elemente
    constructor() {
        super('project-input', 'app', true, "user-input");
        /*this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement;
        this.hostElement = document.getElementById('app')! as HTMLDivElement;
    //prosledili content tj formu koja se nalazila u templetu
        const importedNode = document.importNode(this.templateElement.content,true );
        //definisali formm el u html-u
        this.element = importedNode.firstElementChild as HTMLFormElement;
        //pozvali css pravilo
        this.element.id = "user-input";*/
        //pozvali ostale input elemente
        this.titleInputelement = this.element.querySelector("#title");
        this.descriptionInputElement = this.element.querySelector("#description");
        this.peopleInputElement = this.element.querySelector("#people");
        //pozvali objekte
        this.configure();
        // this.attach();
    }
    renderContent() {
    }
    //validacija 
    getterUserInputs() {
        const enteredTitle = this.titleInputelement.value;
        const destricptionTitle = this.descriptionInputElement.value;
        const peopleTitle = this.peopleInputElement.value;
        const titleValidation = {
            value: enteredTitle,
            required: true,
        };
        const destricptionValidation = {
            value: destricptionTitle,
            required: true,
            minLength: 5,
        };
        const peopleValidation = {
            value: +peopleTitle,
            required: true,
            min: 3,
        };
        if ( //enteredTitle.trim().length===0 ||  destricptionTitle.trim().length===0 || peopleTitle.trim().length===0 */
        !validate(titleValidation) ||
            !validate(destricptionValidation) ||
            !validate(peopleValidation)) {
            alert("Invalid validation , please try agin!");
            return;
        }
        else {
            return [enteredTitle, destricptionTitle, +peopleTitle];
        }
    }
    //brisanj input polja nakon unosa
    clearInputsElements() {
        this.titleInputelement.value = "";
        this.descriptionInputElement.value = "";
        this.peopleInputElement.value = "";
    }
    //dodali evente
    sumbitHendler(event) {
        event.preventDefault();
        const UserInput = this.getterUserInputs();
        if (Array.isArray(UserInput)) {
            const [title, description, peeople] = UserInput;
            projectState.addProjects(title, description, peeople);
            //console.log(title,description,peeople);
            this.clearInputsElements();
        }
    }
    //dodali event listener na button
    configure() {
        this.element.addEventListener("submit", this.sumbitHendler.bind(this));
    }
}
const prjInput = new ProjectInput();
const projetclist1 = new ProjectList("active");
const projetclist2 = new ProjectList("finished");
//# sourceMappingURL=app.js.map