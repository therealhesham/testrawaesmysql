/**
 * ⚠ These are used just to render the Sidebar!
 * You can include any link here, local or external.
 *
 */

interface IRoute{
  path?: string
  icon?: string
  name: string
  routes?: IRoute[]
  checkActive?(pathname: String, route: IRoute): boolean
  exact?: boolean
}

export function routeIsActive (pathname: String, route: IRoute): boolean {
  if (route.checkActive) {
    return route.checkActive(pathname, route)
  }

  return route?.exact
    ? pathname == route?.path
    : (route?.path ? pathname.indexOf(route.path) === 0 : false)
}

const routes: IRoute[] = [
  {
    path: '/office', 
    icon: 'FormsIcon', 
    name: 'Office Dashboard', // 
    exact: true,
  },
  {
    path: '/office/forms',
    icon: 'FormsIcon',
    name: 'Forms',
  },
  {
    path: '/office/cards',
    icon: 'CardsIcon',
    name: 'Cards',
  },
  {
    path: '/office/charts',
    icon: 'ChartsIcon',
    name: 'Charts',
  },
  {
    path: '/office/buttons',
    icon: 'ButtonsIcon',
    name: 'Buttons',
  },
  {
    path: '/office/modals',
    icon: 'ModalsIcon',
    name: 'Modals',
  },
  {
    path: '/office/tables',
    icon: 'TablesIcon',
    name: 'Tables',
  },
  {
    icon: 'PagesIcon',
    name: 'Pages',
    routes: [
      // submenu
      {
        path: '/office/login',
        name: 'Login',
      },
      {
        path: '/office/create-account',
        name: 'Create account',
      },
      {
        path: '/office/forgot-password',
        name: 'Forgot password',
      },
      {
        path: '/office/404',
        name: '404',
      },
      {
        path: '/office/blank',
        name: 'Blank',
      },
    ],
  },
]

export type {IRoute}
export default routes
