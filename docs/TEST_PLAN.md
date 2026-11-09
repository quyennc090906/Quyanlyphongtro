# Test Plan

The current test cases and a blank results column are maintained in [`KiemThu.md`](KiemThu.md). Automated domain tests run locally with:

```powershell
node --test api/test/domain.test.js
```

Docker integration and persistence results must be recorded only after running the stack against an available Docker Engine. Do not treat an unrun case as passed.
