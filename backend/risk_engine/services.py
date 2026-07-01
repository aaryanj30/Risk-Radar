def calculate_vendor_risk(
    cyber,
    financial,
    compliance,
    news
):

    return round(

        cyber * 0.40 +

        financial * 0.20 +

        compliance * 0.25 +

        news * 0.15,

        2
    )