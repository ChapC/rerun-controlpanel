export default class Alert {
    constructor(public severity: AlertSeverity, public key: string, public title: string, public description?:string) {}
}

export enum AlertSeverity {
    Info = 'Info', Loading = 'Loading', Warning = 'Warning', Error = 'Error' 
}