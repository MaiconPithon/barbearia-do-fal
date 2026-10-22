# Architecture rules

- Store Home text visibility as a boolean string in the existing business_settings key/value configuration, defaulting to visible; this preserves compatibility with both Cloud and the external deployment without schema changes.