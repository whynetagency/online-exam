export interface INavigationItem {
    title: string;
    view: string;
    img: string;
    isVisible: boolean;
}

export interface IBreadcrumb {
    link: string;
    name: string;
    handler?: any;
    type?: string;
}