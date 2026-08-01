// Material Symbols Outlined, via Iconify's material-symbols set : matches
// the actual Stitch design (stitch.withgoogle.com project 5527835115590543141),
// which uses Google's Material Symbols Outlined variable font throughout.
// "-outline" suffix = the outlined/default style; no suffix = filled (used
// for active nav items and status icons, matching the FILL 1 toggle Stitch
// uses in its own markup).
export const ICONS = {
  // Navigation
  dashboard: "material-symbols:dashboard-outline",
  properties: "material-symbols:domain",
  units: "material-symbols:door-front-outline",
  myUnits: "material-symbols:door-front-outline",
  tenants: "material-symbols:groups-outline",
  leases: "material-symbols:description-outline",
  invoices: "material-symbols:receipt-long-outline",
  payments: "material-symbols:payments-outline",
  arrears: "material-symbols:warning-outline",
  maintenance: "material-symbols:build-outline",
  announcements: "material-symbols:campaign-outline",
  reports: "material-symbols:analytics-outline",
  staff: "material-symbols:badge-outline",
  subscription: "material-symbols:credit-card-outline",
  settings: "material-symbols:settings-outline",
  auditLog: "material-symbols:history",

  // Platform portal
  organizations: "material-symbols:corporate-fare",
  jobs: "material-symbols:sync-outline",
  webhooks: "material-symbols:webhook",
  featureFlags: "material-symbols:flag-outline",
  systemHealth: "material-symbols:monitor-heart-outline",

  // Actions
  add: "material-symbols:add",
  edit: "material-symbols:edit-outline",
  delete: "material-symbols:delete-outline",
  filter: "material-symbols:filter-list",
  search: "material-symbols:search",
  export: "material-symbols:download",
  send: "material-symbols:send-outline",
  back: "material-symbols:arrow-back",
  menu: "material-symbols:menu",
  logout: "material-symbols:logout",
  notifications: "material-symbols:notifications-outline",
  moreVert: "material-symbols:more-vert",
  arrowForward: "material-symbols:arrow-forward",
  arrowUpward: "material-symbols:arrow-upward",
  visibility: "material-symbols:visibility-outline",
  visibilityOff: "material-symbols:visibility-off-outline",
  check: "material-symbols:check",

  // Status
  success: "material-symbols:check-circle",
  warning: "material-symbols:warning",
  error: "material-symbols:cancel",
  pending: "material-symbols:schedule",
  info: "material-symbols:info-outline",

  // Domain
  mpesa: "material-symbols:smartphone-outline",
  calendar: "material-symbols:calendar-month-outline",
  email: "material-symbols:mail-outline",
  phone: "material-symbols:call-outline",
  document: "material-symbols:description-outline",
  occupancy: "material-symbols:pie-chart-outline",
  key: "material-symbols:key-outline",
  shield: "material-symbols:shield-outline",
  lock: "material-symbols:lock-outline",
  home: "material-symbols:home-outline",
  location: "material-symbols:location-on-outline",
  star: "material-symbols:star",
  supportAgent: "material-symbols:support-agent",
  chat: "material-symbols:chat-outline",
  listAlt: "material-symbols:list-alt-outline",
  timer: "material-symbols:timer-outline",
  monitoring: "material-symbols:monitoring",

  // Empty states : filled, large
  emptyFolder: "material-symbols:folder-off",
  emptyBuilding: "material-symbols:domain",
  emptyInbox: "material-symbols:inbox",
  emptyMoney: "material-symbols:payments",
} as const;

export type IconName = keyof typeof ICONS;
