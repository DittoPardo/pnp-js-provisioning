import { HandlerBase } from "./handlerbase";
import { INavigation, INavigationNode } from "../schema";
import { Web, NavigationNodes, Util } from "sp-pnp-js";

/**
 * Describes the Navigation Object Handler
 */
export class Navigation extends HandlerBase {
    /**
     * Creates a new instance of the Navigation class
     */
    constructor() {
        super("Navigation");
    }

    /**
     * Provisioning navigation
     * 
     * @paramm navigation The navigation to provision
     */
    public ProvisionObjects(web: Web, navigation: INavigation): Promise<void> {

        super.scope_started();

        return new Promise<void>((resolve, reject) => {
            let chain = Promise.resolve();
            if (Util.isArray(navigation.QuickLaunch)) {
                chain.then(_ => this.processNavTree(web.navigation.quicklaunch, navigation.QuickLaunch));
            }
            if (Util.isArray(navigation.TopNavigationBar)) {
                chain.then(_ => this.processNavTree(web.navigation.topNavigationBar, navigation.TopNavigationBar));
            }
            return chain.then(_ => {
                super.scope_ended();
                resolve();
            }).catch(e => {
                super.scope_ended();
                reject(e);
            });
        });
    }

    private processNavTree(target: NavigationNodes, nodes: INavigationNode[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.deleteExistingNodes(target).then(() => {
                nodes.reduce((chain, node) => chain.then(_ => this.processNode(target, node)), Promise.resolve()).then(resolve, reject);
            }, reject);
        });
    }

    private processNode(target: NavigationNodes, node: INavigationNode): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            target.add(node.Title, node.Url).then(result => {
                if (Util.isArray(node.Children)) {
                    this.processNavTree(result.node.children, node.Children).then(resolve, reject);
                } else {
                    resolve();
                }
            }, reject);
        });
    }

    private deleteExistingNodes(target: NavigationNodes) {
        return new Promise<void>((resolve, reject) => {
            target.get().then(existingNodes => {
                existingNodes.reduce((chain: Promise<void>, n: any) => chain.then(_ => this.deleteNode(target, n.Id)), Promise.resolve()).then(() => {
                    resolve();
                }, reject);
            });
        });
    }

    private deleteNode(target: NavigationNodes, id: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            target.getById(id).delete().then(resolve, reject);
        });
    }
}
