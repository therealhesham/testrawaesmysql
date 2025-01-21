/**
 * ⚠ These are used just to render the Sidebar!
 * You can include any link here, local or external.
 *
 */

interface IRoute {
  path?: string;
  icon?: string;
  name: string;
  routes?: IRoute[];
  checkActive?(pathname: String, route: IRoute): boolean;
  exact?: boolean;
}

export function routeIsActive(pathname: String, route: IRoute): boolean {
  if (route.checkActive) {
    return route.checkActive(pathname, route);
  }

  return route?.exact
    ? pathname == route?.path
    : route?.path
    ? pathname.indexOf(route.path) === 0
    : false;
}

const routes: IRoute[] = [
  {
    path: "/admin/home",
    icon: "HomeIcon",
    name: "الرئيسية",
    exact: true,
  },
  {
    icon: "HomeIcon",
    name: "اضافات",
    routes: [
      {
        path: "/admin/addcountry",
        icon: "PeopleIcon",
        name: "اضافة دولة ",
        // exact: true,
      },
      {
        path: "/admin/addoffice",
        icon: "CardsIcon",
        name: "اضافة مكتب",
        // exact: true,
      },
      {
        path: "/admin/addhomemaid",
        icon: "CardsIcon",
        name: "اضافة الى قائمة الوصول",
      },

      {
        path: "/admin/newmaleworker",
        icon: "CardsIcon",
        name: "اضافة عمالة ذكور",
      },
    ],
  },
  {
    path: "/admin/orders",
    icon: "HomeIcon",
    name: "قائمة الطلبات",
  },
  {
    path: "/admin/dashboardadmins",
    icon: "HomeIcon",
    name: "قائمة مديرين الداشبورد",
  },

  {
    path: "/admin/clientslist",
    icon: "HomeIcon",
    name: "قائمة العملاء",
    // exact: true,
  },
  {
    path: "/admin/employees",
    icon: "HomeIcon",
    name: "الموظفين",
  },
  {
    path: "/admin/externaloffices",
    icon: "HomeIcon",
    name: "قائمة المكاتب الخارجية",
    // exact: true,
  },

  {
    path: "/admin/addadmin",
    icon: "CardsIcon",
    name: "اضافة مديرين الى الداشبورد",
  },

  {
    path: "/admin/homemaidlist",
    icon: "CardsIcon",
    name: "قائمة الوصول",
  },
  {
    path: "/admin/maleworkers",
    icon: "CardsIcon",
    name: "عمالة الذكور",
  },

  {
    path: "/admin/cancelcontract",
    icon: "CardsIcon",
    name: "الغاء العقد",
  },

  {
    path: "/admin/cancelledcontracts",
    icon: "CardsIcon",
    name: "العقود الملغاة",
  },

  {
    path: "/admin/transferform",
    icon: "CardsIcon",
    name: "نقل الكفالة",
  },

  {
    path: "/admin/transferlist",
    icon: "CardsIcon",
    name: "معاملات نقل الكفالة",
  },

  {
    path: "/admin/cancelcontract",
    icon: "CardsIcon",
    name: "انهاء المعاملة",
  },

  {
    path: "/admin/endedcontracts",
    icon: "CardsIcon",
    name: "معاملات تم انهائها",
  },
  //   {
  //     path: '/admin/addhomemaid',
  //     icon: 'FormsIcon',
  //     name: 'Add Home Maid',
  //     // exact: true,
  //   },{
  //     path: '/admin/homemaidlist',
  //     icon: 'HomeIcon',
  //     name: 'Homemaid Arrival List',
  //   },
  // {
  //     path: '/admin/femaleworkers',
  //     icon: 'HomeIcon',
  //     name: 'Female Workers List',
  //     // exact: true,
  //   },{
  //     path: '/admin/maleworkers',
  //     icon: 'HomeIcon',
  //     name: 'Male Workers List',
  //     // exact: true,
  //   },{
  //     path: '/admin/newmaleworker',
  //     icon: 'FormsIcon',
  //     name: 'Add Male Worker',
  //     // exact: true,
  //   },{
  //     path: '/admin/newfemaleworker',
  //     icon: 'FormsIcon',
  //     name: 'Add Female Worker',
  //     // exact: true,
  //   }
];

export type { IRoute };
export default routes;
