interface Dragable {
  dragStartHendler(event: DragEvent): void;
  dragEndHendler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHendler(event: DragEvent): void;
  dragHendler(event: DragEvent): void;
  dragLeaveHendler(event: DragEvent): void;
}

enum ProjectStatus {
  Active,
  Finished,
}
class Projects {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public numofpeopel: number,
    public status: ProjectStatus
  ) {}
}
type listener = (items: Projects[]) => void;
class ProjectState {
  private projects: Projects[] = [];
  private listeners: listener[] = [];
  private static instance: ProjectState;

  private constructor() {}

  static GetInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }
  addListeners(listenerFN: listener) {
    this.listeners.push(listenerFN);
  }
  addProjects(title: string, description: string, numofpeople: number) {
    const newProjects = new Projects(
      Math.random().toString(),
      title,
      description,
      numofpeople,
      ProjectStatus.Active
    );
    this.projects.push(newProjects);
    for (const listenerFN of this.listeners) {
      listenerFN(this.projects.slice());
    }
  }
  moveProject(projectId: string, newStatus: ProjectStatus) {
    const projectss = this.projects.find((prj) => prj.id === projectId);
    if (projectss) {
      projectss.status = newStatus;
      this.uppdateListeners();
    }
  }
  private uppdateListeners() {
    for (const listenerFN of this.listeners) {
      listenerFN(this.projects.slice());
    }
  }
}
const projectState = ProjectState.GetInstance();

interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validateInput: Validatable) {
  let isValid = true;
  if (validateInput.required) {
    isValid = isValid && validateInput.value.toString().trim().length !== 0;
  }
  if (
    validateInput.minLength != null &&
    typeof validateInput.value === "string"
  ) {
    isValid = isValid && validateInput.value.length > validateInput.minLength;
  }
  if (
    validateInput.maxLength != null &&
    typeof validateInput.value === "string"
  ) {
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

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  constructor(
    templateElementId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElID?: string
  ) {
    this.templateElement = document.getElementById(
      templateElementId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as U;
    if (newElID) {
      this.element.id = newElID;
    }
    this.attach(insertAtStart);
  }
  private attach(insertAtStart: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtStart ? "afterbegin" : "beforeend",
      this.element
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}

class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Dragable
{
  get persons() {
    if (this.project.numofpeopel === 1) {
      return "1 persons";
    } else {
      return `${this.project.numofpeopel} persons `;
    }
  }

  private project: Projects;
  constructor(hostId: string, project: Projects) {
    super("single-project", hostId, false, project.id);
    this.project = project;
    this.configure();
    this.renderContent();
  }

  dragStartHendler(event: DragEvent) {
    event.dataTransfer!.setData("text/plain", this.project.id);
    event.dataTransfer!.effectAllowed = "move";
  }

  dragEndHendler(event: DragEvent) {
    console.log("dropable");
  }

  configure() {
    this.element.addEventListener(
      "dragstart",
      this.dragStartHendler.bind(this)
    );
    this.element.addEventListener("dragend", this.dragEndHendler.bind(this));
  }
  renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    this.element.querySelector("h3")!.textContent = this.persons + "assigned";

    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

class ProjectList
  extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedProject: Projects[];
  constructor(private type: "active" | "finished") {
    super("project-list", "app", false, `${type}-projects`);

    this.assignedProject = [];

    this.renderContect();
  }
  renderProject() {
    const lisetEl = document.getElementById(
      `${this.type}-projects-list`
    )! as HTMLUListElement;
    lisetEl.innerHTML = "";
    for (const prjItem of this.assignedProject) {
      new ProjectItem(this.element.querySelector("ul")!.id, prjItem);
    }
  }

  dragOverHendler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      const listEl = this.element.querySelector("ul")!;
      listEl.classList.add("droppable");
    }
  }

  dragLeaveHendler(_: DragEvent) {
    const listEl = this.element.querySelector("ul")!;
    listEl.classList.remove("droppable");
  }

  dragHendler(event: DragEvent) {
    const prjid = event.dataTransfer!.getData("text/plain");
    projectState.moveProject(
      prjid,
      this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished
    );
  }
  configure() {
    this.element.addEventListener("dragover", this.dragOverHendler.bind(this));
    this.element.addEventListener(
      "dragleave",
      this.dragLeaveHendler.bind(this)
    );
    this.element.addEventListener("drop", this.dragHendler.bind(this));
    projectState.addListeners((project: Projects[]) => {
      const relevantProject = project.filter((prj) => {
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
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }
  renderContent() {}
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputelement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, "user-input");

    this.titleInputelement = this.element.querySelector(
      "#title"
    )! as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    )! as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    )! as HTMLInputElement;
    this.configure();
  }
  renderContent() {}

  private getterUserInputs(): [string, string, number] | void {
    const enteredTitle = this.titleInputelement.value;
    const destricptionTitle = this.descriptionInputElement.value;
    const peopleTitle = this.peopleInputElement.value;

    const titleValidation: Validatable = {
      value: enteredTitle,
      required: true,
    };

    const destricptionValidation: Validatable = {
      value: destricptionTitle,
      required: true,
      minLength: 5,
    };

    const peopleValidation: Validatable = {
      value: +peopleTitle,
      required: true,
      min: 3,
    };
    if (
      !validate(titleValidation) ||
      !validate(destricptionValidation) ||
      !validate(peopleValidation)
    ) {
      alert("Invalid validation , please try agin!");
      return;
    } else {
      return [enteredTitle, destricptionTitle, +peopleTitle];
    }
  }

  private clearInputsElements() {
    this.titleInputelement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  private sumbitHendler(event: Event) {
    event.preventDefault();
    const UserInput = this.getterUserInputs();
    if (Array.isArray(UserInput)) {
      const [title, description, peeople] = UserInput;
      projectState.addProjects(title, description, peeople);
      this.clearInputsElements();
    }
  }

  configure() {
    this.element.addEventListener("submit", this.sumbitHendler.bind(this));
  }
}

const prjInput = new ProjectInput();
const projetclist1 = new ProjectList("active");
const projetclist2 = new ProjectList("finished");
