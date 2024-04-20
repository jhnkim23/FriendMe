class List_Node {
    constructor(prev, next, client_object) {
        this.prev = prev;
        this.next = next;
        this.client = client_object;
    }
}

module.exports = List_Node;