export default class List_Node {
    constructor(prev, client_object) {
        this.prev = prev;
        this.next = null;
        this.client = client_object;
    }
}