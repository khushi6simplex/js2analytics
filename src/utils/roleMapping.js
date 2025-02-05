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
      taluka: "state='Maharashtra'",
      district: "state='Maharashtra'",
      state: "state='Maharashtra'",
    },
  },
  jsdistrict: {
    jurisdiction: 'district',
    filters: {
      taluka: "district='{{jurisdiction}}'",
      district: "district='{{jurisdiction}}'",
    },
  },
  jstaluka: {
    jurisdiction: 'taluka',
    filters: {
      taluka: "taluka='{{jurisdiction}}'",
    },
  },
};
