/*
 * @Author: Alex Sorafumo
 * @Date:   2017-05-02 10:48:03
 * @Last Modified by:   Alex Sorafumo
 * @Last Modified time: 2017-05-02 10:52:20
 */

import { Observable } from 'rxjs';

import { COMPOSER } from '../../../settings';
import { EngineStatusVariable } from './status-variable.class';

export class EngineModule {
    public id: string;         // Module name
    public parent: any;        // Module's system
    public index: number = 0;  // Module Index
    public status_variables: any = {};
    public debugger: any;
    private _debug: boolean = false;
    private service: any;       // Systems Service

    constructor(srv: object, parent: any, name: string, i: number) {
        this.id = name;
        this.service = srv;
        this.parent = parent;
        this.index = i || 1;
        if (isNaN(this.index)) {
            this.index = 1;
        }
        COMPOSER.observe('debug').subscribe((data: any) => this._debug = data);
    }
    /**
     * Bind to status variable on module
     * @param name  Name of the status variable to bind
     * @param cb_fn Callback for changes of the binding's value
     * @return Unbind callback
     */
    public bind(name: string, next: (change: boolean) => void) {
        const variable = this.get(name);
        return variable.bind(next);
    }

    /**
     * Execute a function on this module on the server
     * @param fn    Function/Method name
     * @param prop  Status variable to be changed
     * @param args  Arguments to pass to the function
     * @return  Promise for the result of the excute on the server
     */
    public exec(fn: string, args: any[] = []) {
        return new Promise((resolve, reject) => {
            const system = this.parent;
            this.service.io.exec(system.id, this.id, this.index, fn, args)
                .then((result) => resolve(result), (err) => reject(err));
        });
    }

    /**
     * Unbind to the give status variable
     * @param prop Name of the status variable to unbind
     */
    public unbind(prop: string) {
        const variable = this.get(prop);
        variable.unbind();
    }

    /**
     * Send debug command to the server
     */
    public debug() {
        const id = this.service.io.debug(this.parent.id, this.id, this.index);
    }

    /**
     * Send ignore command to the server
     */
    public ignore() {
        const id = this.service.io.ignore(this.parent.id, this.id, this);
    }

    /**
     * Get the status variable from the module
     * @param name Name of status variable to get
     * @return  Status variable
     */
    public get(name: string) {
        if (this.status_variables[name]) {
            return this.status_variables[name];
        }
        const s_var = new EngineStatusVariable(this.service, this, name, 0);
        this.status_variables[name] = s_var;
        return s_var;
    }

    /**
     * Rebinds all the status variables in the module
     */
    public rebind() {
        for (const id in this.status_variables) {
            if (this.status_variables.hasOwnProperty(id)) {
                this.status_variables[id].rebind();
            }
        }
    }

    /**
     * Sets the debugger for the module
     * @param debug Debugger
     * @return  Active state of the debugger
     */
    public setDebug(debug: any) {
        if (typeof debug !== 'object') {
            return false;
        }
        this.debugger = debug;
        COMPOSER.log('Debugger', `Bound to module ${this.id} ${this.index} on system ${this.parent.id}`);
        return true;
    }
}
