from django.db import models
from common.models import OrganizationScopedModel


class Deal(OrganizationScopedModel):
    """
    A sales opportunity moving through pipeline stages. Learned from the
    Customer module bug: lookup_field is set explicitly on the viewset
    (not here) so detail routes resolve by public_id, not internal pk.
    """

    class Stage(models.TextChoices):
        LEAD = "lead", "Lead"
        CONTACTED = "contacted", "Contacted"
        PROPOSAL = "proposal", "Proposal"
        WON = "won", "Won"
        LOST = "lost", "Lost"

    title = models.CharField(max_length=255)
    customer = models.ForeignKey(
        "customers.Customer", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="deals",
    )
    value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.LEAD)
    owner = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="owned_deals",
    )
    expected_close_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta(OrganizationScopedModel.Meta):
        indexes = [models.Index(fields=["organization", "stage"])]

    def __str__(self):
        return self.title
