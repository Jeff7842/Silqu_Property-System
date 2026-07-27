export const ICONS = {
  // Navigation
  dashboard: "solar:widget-5-linear",
  properties: "solar:buildings-3-linear",
  units: "solar:home-angle-linear",
  myUnits: "solar:home-angle-linear",
  tenants: "solar:users-group-rounded-linear",
  leases: "solar:document-text-linear",
  invoices: "solar:bill-list-linear",
  payments: "solar:wallet-money-linear",
  arrears: "solar:danger-triangle-linear",
  maintenance: "solar:settings-minimalistic-linear",
  announcements: "solar:bell-bing-linear",
  reports: "solar:chart-2-linear",
  staff: "solar:users-group-two-rounded-linear",
  subscription: "solar:card-linear",
  settings: "solar:settings-linear",
  auditLog: "solar:clipboard-list-linear",

  // Platform portal
  organizations: "solar:buildings-2-linear",
  jobs: "solar:refresh-circle-linear",
  webhooks: "solar:transfer-horizontal-linear",
  featureFlags: "solar:flag-linear",
  systemHealth: "solar:pulse-linear",

  // Actions
  add: "solar:add-circle-linear",
  edit: "solar:pen-new-square-linear",
  delete: "solar:trash-bin-trash-linear",
  filter: "solar:filter-linear",
  search: "solar:magnifer-linear",
  export: "solar:download-minimalistic-linear",
  send: "solar:plain-linear",
  back: "solar:alt-arrow-left-linear",
  menu: "solar:hamburger-menu-linear",
  logout: "solar:logout-2-linear",
  notifications: "solar:bell-linear",

  // Status
  success: "solar:check-circle-bold",
  warning: "solar:danger-circle-bold",
  error: "solar:close-circle-bold",
  pending: "solar:clock-circle-bold",

  // Domain
  mpesa: "solar:smartphone-linear",
  calendar: "solar:calendar-linear",
  email: "solar:letter-linear",
  phone: "solar:phone-linear",
  document: "solar:file-text-linear",
  occupancy: "solar:pie-chart-2-linear",
  key: "solar:key-linear",
  shield: "solar:shield-check-linear",

  // Empty states — duotone, large
  emptyFolder: "solar:folder-open-bold-duotone",
  emptyBuilding: "solar:buildings-3-bold-duotone",
  emptyInbox: "solar:inbox-bold-duotone",
  emptyMoney: "solar:wallet-money-bold-duotone",
} as const;

export type IconName = keyof typeof ICONS;
