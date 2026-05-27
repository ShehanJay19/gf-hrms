from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from sqlalchemy.orm import Session, joinedload
from io import BytesIO

from app.models.payroll import Payslip, PayrollRun
from app.models.employee import Employee

BRAND_BLUE  = colors.HexColor("#1B4F8E")
LIGHT_BLUE  = colors.HexColor("#D6E4F7")
DARK        = colors.HexColor("#1A1A2E")
GRAY        = colors.HexColor("#F2F4F7")
GREEN       = colors.HexColor("#1E8449")
WHITE       = colors.white

MONTHS = [
    "", "January", "February", "March", "April",
    "May", "June", "July", "August", "September",
    "October", "November", "December"
]


def generate_payslip_pdf(db: Session, run_id: int, employee_id: int) -> BytesIO:
    payslip = db.query(Payslip).options(
        joinedload(Payslip.employee).joinedload(Employee.department),
        joinedload(Payslip.employee).joinedload(Employee.designation)
    ).filter(
        Payslip.payroll_run_id == run_id,
        Payslip.employee_id   == employee_id
    ).first()

    if not payslip:
        raise ValueError("Payslip not found")

    run      = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    employee = payslip.employee

    output = BytesIO()
    doc    = SimpleDocTemplate(
        output, pagesize=A4,
        rightMargin=15*mm, leftMargin=15*mm,
        topMargin=15*mm,   bottomMargin=15*mm
    )

    styles = getSampleStyleSheet()
    elements = []

    # ── Header ───────────────────────────────────────────
    header_data = [[
        Paragraph(
            "<font color='white'><b>GARMENT FACTORY PVT LTD</b><br/>"
            "<font size='9'>HR Management System</font></font>",
            ParagraphStyle("h", fontSize=14, textColor=WHITE,
                           fontName="Helvetica-Bold", alignment=TA_LEFT)
        ),
        Paragraph(
            f"<font color='white'><b>SALARY SLIP</b><br/>"
            f"<font size='10'>{MONTHS[run.month]} {run.year}</font></font>",
            ParagraphStyle("h2", fontSize=16, textColor=WHITE,
                           fontName="Helvetica-Bold", alignment=TA_RIGHT)
        )
    ]]
    header_table = Table(header_data, colWidths=[100*mm, 80*mm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_BLUE),
        ("PADDING",    (0, 0), (-1, -1), 12),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 6*mm))

    # ── Employee Details ─────────────────────────────────
    emp_data = [
        ["Employee No",  employee.employee_no,
         "Department",   employee.department.name if employee.department else "N/A"],
        ["Full Name",    employee.full_name,
         "Designation",  employee.designation.name if employee.designation else "N/A"],
        ["NIC",          employee.nic,
         "Employment",   employee.employment_type.value.title()],
        ["EPF No",       employee.epf_no or "N/A",
         "Pay Period",   f"{MONTHS[run.month]} {run.year}"],
    ]

    emp_table = Table(emp_data, colWidths=[35*mm, 55*mm, 35*mm, 55*mm])
    emp_table.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (0, -1), LIGHT_BLUE),
        ("BACKGROUND",  (2, 0), (2, -1), LIGHT_BLUE),
        ("FONTNAME",    (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",    (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("PADDING",     (0, 0), (-1, -1), 6),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 5*mm))

    # ── Attendance Summary ────────────────────────────────
    att_data = [
        ["Working Days", "Present Days", "Absent Days", "No-Pay Days", "OT Hours"],
        [
            str(payslip.working_days),
            str(payslip.present_days),
            str(payslip.absent_days),
            str(payslip.no_pay_days),
            f"{float(payslip.ot_hours):.2f}"
        ]
    ]
    att_table = Table(att_data, colWidths=[36*mm] * 5)
    att_table.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), BRAND_BLUE),
        ("TEXTCOLOR",   (0, 0), (-1, 0), WHITE),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("ALIGN",       (0, 0), (-1, -1), "CENTER"),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("PADDING",     (0, 0), (-1, -1), 6),
        ("BACKGROUND",  (0, 1), (-1, 1), GRAY),
    ]))
    elements.append(att_table)
    elements.append(Spacer(1, 5*mm))

    # ── Earnings & Deductions ─────────────────────────────
    pay_data = [
        ["EARNINGS", "Amount (LKR)", "DEDUCTIONS", "Amount (LKR)"],
        ["Basic Salary",      f"{float(payslip.basic_salary):,.2f}",
         "EPF (8%)",          f"{float(payslip.epf_employee):,.2f}"],
        ["OT Amount",         f"{float(payslip.ot_amount):,.2f}",
         "No-Pay Deduction",  f"{float(payslip.no_pay_deduct):,.2f}"],
        ["Attendance Allow",  f"{float(payslip.attendance_allow):,.2f}",
         "Loan Deduction",    f"{float(payslip.loan_deduct):,.2f}"],
        ["Transport Allow",   f"{float(payslip.transport_allow):,.2f}",
         "Other Deductions",  f"{float(payslip.other_deduct):,.2f}"],
        ["Meal Allow",        f"{float(payslip.meal_allow):,.2f}", "", ""],
        ["Other Allow",       f"{float(payslip.other_allow):,.2f}", "", ""],
        ["GROSS SALARY",      f"{float(payslip.gross_salary):,.2f}",
         "TOTAL DEDUCTIONS",  f"{float(payslip.total_deductions):,.2f}"],
    ]

    pay_table = Table(pay_data, colWidths=[50*mm, 40*mm, 50*mm, 40*mm])
    pay_table.setStyle(TableStyle([
        # Header row
        ("BACKGROUND",  (0, 0), (1, 0), BRAND_BLUE),
        ("BACKGROUND",  (2, 0), (3, 0), BRAND_BLUE),
        ("TEXTCOLOR",   (0, 0), (-1, 0), WHITE),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        # Totals row
        ("BACKGROUND",  (0, -1), (1, -1), LIGHT_BLUE),
        ("BACKGROUND",  (2, -1), (3, -1), LIGHT_BLUE),
        ("FONTNAME",    (0, -1), (-1, -1), "Helvetica-Bold"),
        # General
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("ALIGN",       (1, 0), (1, -1), "RIGHT"),
        ("ALIGN",       (3, 0), (3, -1), "RIGHT"),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("PADDING",     (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [WHITE, GRAY]),
    ]))
    elements.append(pay_table)
    elements.append(Spacer(1, 5*mm))

    # ── Net Salary Banner ─────────────────────────────────
    net_data = [[
        Paragraph(
            f"<font color='white' size='12'><b>NET SALARY PAYABLE: "
            f"LKR {float(payslip.net_salary):,.2f}</b></font>",
            ParagraphStyle("net", fontSize=12, textColor=WHITE,
                           fontName="Helvetica-Bold", alignment=TA_CENTER)
        )
    ]]
    net_table = Table(net_data, colWidths=[180*mm])
    net_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREEN),
        ("PADDING",    (0, 0), (-1, -1), 10),
    ]))
    elements.append(net_table)
    elements.append(Spacer(1, 5*mm))

    # ── Employer Contributions ────────────────────────────
    cont_data = [
        ["Employer EPF (12%)", f"LKR {float(payslip.epf_employer):,.2f}",
         "ETF (3%)",           f"LKR {float(payslip.etf_employer):,.2f}"]
    ]
    cont_table = Table(cont_data, colWidths=[50*mm, 40*mm, 50*mm, 40*mm])
    cont_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GRAY),
        ("FONTSIZE",   (0, 0), (-1, -1), 8),
        ("ALIGN",      (1, 0), (1, -1), "RIGHT"),
        ("ALIGN",      (3, 0), (3, -1), "RIGHT"),
        ("GRID",       (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ("PADDING",    (0, 0), (-1, -1), 5),
        ("FONTNAME",   (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",   (2, 0), (2, -1), "Helvetica-Bold"),
    ]))
    elements.append(cont_table)
    elements.append(Spacer(1, 8*mm))

    # ── Footer ────────────────────────────────────────────
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE))
    elements.append(Spacer(1, 3*mm))
    footer_style = ParagraphStyle(
        "footer", fontSize=8, textColor=colors.gray,
        alignment=TA_CENTER, fontName="Helvetica"
    )
    elements.append(Paragraph(
        "This is a computer-generated payslip and does not require a signature. "
        "For queries contact HR Department.",
        footer_style
    ))

    doc.build(elements)
    output.seek(0)
    return output