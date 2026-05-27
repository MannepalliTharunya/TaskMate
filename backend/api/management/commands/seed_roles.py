from django.core.management.base import BaseCommand
from api.models import Role


class Command(BaseCommand):
    help = 'Seed initial roles into the database'

    def handle(self, *args, **kwargs):
        for role_name in [Role.ADMIN, Role.USER]:
            role, created = Role.objects.get_or_create(name=role_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created role: {role_name}'))
            else:
                self.stdout.write(f'Role already exists: {role_name}')
