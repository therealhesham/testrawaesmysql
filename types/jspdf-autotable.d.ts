declare module 'jspdf-autotable' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}
