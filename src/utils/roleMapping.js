export const roleMapping = {
  orgadmin: {
    jurisdiction: null,
    filters: {},
  },
  customeradmin: {
    jurisdiction: 'state',
    filters: {
      taluka: "state='Maharashtra'",
      district: "state='Maharashtra'",
      state: "state='Maharashtra'",
    },
  },
  jsstate: {
    jurisdiction: 'state',
    filters: {
      state: "state='Maharashtra'",
    },
  },
  jsdistrict: {
    jurisdiction: 'district',
    filters: {
      state: "state='Maharashtra'",
      district: "district='{{jurisdiction}}'",
      taluka: "district='{{jurisdiction}}'",
    },
  },
  jstaluka: {
    jurisdiction: 'taluka',
    filters: {
      taluka: "taluka='{{jurisdiction}}'",
    },
  },
};
