// https://material.angular.io/components/tree/examples

import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Injectable, OnInit, Output } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';
import { DataService } from 'src/app/core/services/data.service';
import { HelperService } from 'src/app/core/services/helperService.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { APIData } from '../../model/api-data.model';

/**
 * Node for to-do item
 */
export class TagItemNode {
    children!: TagItemNode[];
    item!: string;
}

/** Flat to-do item node with expandable and level information */
export class TagItemFlatNode {
    item!: string;
    level!: number;
    expandable!: boolean;
}

/**
 * The Json object for to-do list data.
 */
const TREE_DATA = {
    All: {
        '!DELETE!': null
    }
};

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
    dataChange = new BehaviorSubject<TagItemNode[]>([]);

    get data(): TagItemNode[] { return this.dataChange.value; }

    constructor() {
        this.initialize();
    }

    initialize(): void {
        // Build the tree nodes from Json object. The result is a list of `TagItemNode` with nested
        //     file node as children.
        const data = this.buildFileTree(TREE_DATA, 0);

        // Notify the change.
        this.dataChange.next(data);
    }

    /**
     * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
     * The return value is the list of `TagItemNode`.
     */
    buildFileTree(obj: { [key: string]: any }, level: number): TagItemNode[] {
        return Object.keys(obj).reduce<TagItemNode[]>((accumulator, key) => {
            const value = obj[key];
            const node = new TagItemNode();
            node.item = key;

            if (value != null) {
                if (typeof value === 'object') {
                    node.children = this.buildFileTree(value, level + 1);
                } else {
                    node.item = value;
                }
            }

            return accumulator.concat(node);
        }, []);
    }

    /** Add an item to to-do list */
    insertItem(parent: TagItemNode, name: string): void {
        if (parent.children) {
            if (parent.children.findIndex(x => x.item === name) === -1) {
                parent.children.push({ item: name } as TagItemNode);
                parent.children.sort((a, b) => a.item.localeCompare(b.item));
                this.dataChange.next(this.data);
            }
        } else {
            parent.children = [];
            this.insertItem(parent, name);
        }
    }

    updateItem(node: TagItemNode, name: string): void {
        node.item = name;
        this.dataChange.next(this.data);
    }

    deleteItem(parent: TagItemNode, name: string): void {
        if (parent.children) {
            const index = parent.children.findIndex(x => x.item === name);
            if (index !== -1) {
                parent.children.splice(index, 1);
                this.dataChange.next(this.data);
            }
        }
    }
}

/**
 * @title Tree with checkboxes
 */
@Component({
    selector: 'app-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.scss'],
    providers: [ChecklistDatabase]
})
export class TagsComponent implements OnInit {

    @Output() filterList = new EventEmitter<string[]>();

    /** Map from flat node to nested node. This helps us finding the nested node to be modified */
    flatNodeMap = new Map<TagItemFlatNode, TagItemNode>();

    /** Map from nested node to flattened node. This helps us to keep the same object for selection */
    nestedNodeMap = new Map<TagItemNode, TagItemFlatNode>();

    /** A selected parent node to be inserted */
    selectedParent: TagItemFlatNode | null = null;

    /** The new item's name */
    newItemName = '';

    treeControl: FlatTreeControl<TagItemFlatNode>;

    treeFlattener: MatTreeFlattener<TagItemNode, TagItemFlatNode>;

    dataSource: MatTreeFlatDataSource<TagItemNode, TagItemFlatNode>;

    /** The selection for checklist */
    checklistSelection = new SelectionModel<TagItemFlatNode>(true /* multiple */);

    dataLoaded = false;

    constructor(
        private _database: ChecklistDatabase,
        private dataService: DataService,
        private localStorageService: LocalStorageService,
    ) {
        this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel,
            this.isExpandable, this.getChildren);
        this.treeControl = new FlatTreeControl<TagItemFlatNode>(this.getLevel, this.isExpandable);
        this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

        _database.dataChange.subscribe(data => {
            this.dataSource.data = data;
        });
    }

    ngOnInit(): void {
        this.getTags();
    }

    getTags(): void {
        const [result, _] = this.dataService.getData('info');
        result.subscribe((data: APIData) => {
            this.formatTags(data.data.tags);
        });
    }

    formatTags(rawTags: string[]): void {
        rawTags.forEach(t => {
            const levels = t.split('_');
            let parent: TagItemNode | undefined = this._database.data[0];
            levels.forEach((_, index) => {
                const toSave = levels.slice(0, index + 1).join('_');
                if (parent !== undefined) {
                    this._database.insertItem(parent, toSave);
                    parent = parent.children.find(x => x.item === toSave);
                }
            });
        });
        this._database.deleteItem(this._database.data[0], '!DELETE!');

        const tags = this.localStorageService.getTags();
        this.treeControl.dataNodes.forEach(node => {
            if (node.item !== 'All') {
                if (!tags.includes(node.item)) {
                    this.tagItemSelectionToggle(node, true);
                }
            }
        });
        this.dataLoaded = true;
        this.updateStorage();
    }

    updateStorage(): void {
        if (this.dataLoaded) {
            const filters: string[] = [];
            this.treeControl.dataNodes.forEach(node => {
                if (!this.checklistSelection.isSelected(node)) {
                    filters.push(node.item);
                }
            });
            this.localStorageService.setTags(filters);
            this.filterList.emit(filters);
        }
    }

    tagToString(tag: string): string {
        return HelperService.tagToString(tag);
    }

    getLevel = (node: TagItemFlatNode) => node.level;

    isExpandable = (node: TagItemFlatNode) => node.expandable;

    getChildren = (node: TagItemNode): TagItemNode[] => node.children;

    hasChild = (_: number, _nodeData: TagItemFlatNode) => _nodeData.expandable;

    /**
     * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
     */
    transformer = (node: TagItemNode, level: number) => {
        const existingNode = this.nestedNodeMap.get(node);
        const flatNode = existingNode && existingNode.item === node.item
            ? existingNode
            : new TagItemFlatNode();
        flatNode.item = node.item;
        flatNode.level = level;
        flatNode.expandable = !!node.children?.length;
        this.flatNodeMap.set(flatNode, node);
        this.nestedNodeMap.set(node, flatNode);
        return flatNode;
    }

    /** Whether all the descendants of the node are selected. */
    descendantsAllSelected(node: TagItemFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const descAllSelected = descendants.length > 0 && descendants.every(child => {
            return this.checklistSelection.isSelected(child);
        });
        return descAllSelected;
    }

    /** Whether part of the descendants are selected */
    descendantsPartiallySelected(node: TagItemFlatNode): boolean {
        const descendants = this.treeControl.getDescendants(node);
        const result = descendants.some(child => this.checklistSelection.isSelected(child));
        return result && !this.descendantsAllSelected(node);
    }

    /** Toggle the tag item selection. Select/deselect all the descendants node */
    tagItemSelectionToggle(node: TagItemFlatNode, state?: boolean): void {
        if (state === true) {
            this.checklistSelection.select(node);
        } else if (state === false) {
            this.checklistSelection.deselect(node);
        } else {
            this.checklistSelection.toggle(node);
        }
        const descendants = this.treeControl.getDescendants(node);
        this.checklistSelection.isSelected(node)
            ? this.checklistSelection.select(...descendants)
            : this.checklistSelection.deselect(...descendants);

        // Force update for the parent
        descendants.forEach(child => this.checklistSelection.isSelected(child));
        this.checkAllParentsSelection(node);
        this.updateStorage();
    }

    /** Toggle a leaf tag item selection. Check all the parents to see if they changed */
    tagLeafItemSelectionToggle(node: TagItemFlatNode): void {
        this.checklistSelection.toggle(node);
        this.checkAllParentsSelection(node);
        this.updateStorage();
    }

    /* Checks all the parents when a leaf node is selected/unselected */
    checkAllParentsSelection(node: TagItemFlatNode): void {
        let parent: TagItemFlatNode | null = this.getParentNode(node);
        while (parent) {
            this.checkRootNodeSelection(parent);
            parent = this.getParentNode(parent);
        }
    }

    /** Check root node checked state and change it accordingly */
    checkRootNodeSelection(node: TagItemFlatNode): void {
        const nodeSelected = this.checklistSelection.isSelected(node);
        const descendants = this.treeControl.getDescendants(node);
        const descAllSelected = descendants.length > 0 && descendants.every(child => {
            return this.checklistSelection.isSelected(child);
        });
        if (nodeSelected && !descAllSelected) {
            this.checklistSelection.deselect(node);
        } else if (!nodeSelected && descAllSelected) {
            this.checklistSelection.select(node);
        }
    }

    /* Get the parent node of a node */
    getParentNode(node: TagItemFlatNode): TagItemFlatNode | null {
        const currentLevel = this.getLevel(node);

        if (currentLevel < 1) {
            return null;
        }

        const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

        for (let i = startIndex; i >= 0; i--) {
            const currentNode = this.treeControl.dataNodes[i];

            if (this.getLevel(currentNode) < currentLevel) {
                return currentNode;
            }
        }
        return null;
    }

}
