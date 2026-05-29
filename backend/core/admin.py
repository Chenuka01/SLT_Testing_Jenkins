from django.contrib import admin
from .models import User, Project, Credential, AccessRequest, EnrollmentRequest, ActivityLog, BreakGlassEvent, BreakGlassApproval

admin.site.register(User)
admin.site.register(Project)
admin.site.register(Credential)
admin.site.register(AccessRequest)
admin.site.register(EnrollmentRequest)
admin.site.register(ActivityLog)
admin.site.register(BreakGlassEvent)
admin.site.register(BreakGlassApproval)
