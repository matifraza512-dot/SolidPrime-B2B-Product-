from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_notificationpreference"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="members",
                to="accounts.organization",
            ),
        ),
    ]
