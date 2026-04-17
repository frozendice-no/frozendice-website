import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function WelcomeEmail() {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Frozen Dice — your Norwegian D&D community</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to Frozen Dice!</Heading>
          <Text style={text}>
            Thanks for joining our community of tabletop RPG enthusiasts. We&apos;re
            glad to have you.
          </Text>
          <Text style={text}>Here&apos;s what you can expect from us:</Text>
          <Section style={list}>
            <Text style={listItem}>
              New blog posts about D&D tips, homebrew content, and session recaps
            </Text>
            <Text style={listItem}>
              Early access to new battle maps and campaign resources
            </Text>
            <Text style={listItem}>
              Exclusive discounts on our digital store products
            </Text>
          </Section>
          <Text style={text}>
            In the meantime, check out our latest content on the{" "}
            <Link href="https://frozendice.no/blog" style={link}>
              blog
            </Link>{" "}
            or browse the{" "}
            <Link href="https://frozendice.no/store" style={link}>
              store
            </Link>
            .
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Frozen Dice — Norwegian D&D Community
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const heading = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const list = { margin: "0 0 24px", paddingLeft: "16px" };

const listItem = {
  color: "#4a4a4a",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 8px",
};

const link = { color: "#6366f1", textDecoration: "underline" };

const hr = { borderColor: "#e6ebf1", margin: "24px 0" };

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
};
