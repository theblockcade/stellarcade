import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileOnboardingDialog } from "./ProfileOnboardingDialog";

const walletState = {
  address: "GABCDEF1234567890",
  capabilities: { isConnected: true, isConnecting: false, isReconnecting: false, canConnect: true },
};

vi.mock("../hooks/useWalletStatus", () => ({
  useWalletStatus: () => walletState,
}));

const createProfileMock = vi.fn();
vi.mock("../services/profile-service", async () => {
  const actual = await vi.importActual<typeof import("../services/profile-service")>(
    "../services/profile-service",
  );
  return { ...actual, createProfile: (...args: unknown[]) => createProfileMock(...args) };
});

describe("ProfileOnboardingDialog", () => {
  beforeEach(() => {
    createProfileMock.mockReset();
    createProfileMock.mockResolvedValue({ ok: true, profile: { address: walletState.address } });
  });

  it("renders nothing when closed", () => {
    render(<ProfileOnboardingDialog open={false} />);
    expect(screen.queryByTestId("profile-onboarding")).not.toBeInTheDocument();
  });

  /*
   * The whole point of this dialog is that the app stops choosing an identity
   * for the player. Submitting must be impossible until they have supplied
   * both pieces themselves.
   */
  it("keeps submit disabled until a username and the 18+ box are both provided", async () => {
    const user = userEvent.setup();
    render(<ProfileOnboardingDialog open />);

    const submit = screen.getByTestId("onboarding-submit");
    expect(submit).toBeDisabled();

    await user.type(screen.getByTestId("onboarding-username-input"), "nova_runner");
    expect(submit).toBeDisabled();

    await user.click(screen.getByTestId("onboarding-age-checkbox"));
    expect(submit).toBeEnabled();
  });

  it("does not prefill a username", () => {
    render(<ProfileOnboardingDialog open />);
    expect(screen.getByTestId("onboarding-username-input")).toHaveValue("");
  });

  it("blocks an invalid username before hitting the API", async () => {
    const user = userEvent.setup();
    render(<ProfileOnboardingDialog open />);

    await user.type(screen.getByTestId("onboarding-username-input"), "no");
    await user.click(screen.getByTestId("onboarding-age-checkbox"));

    expect(screen.getByTestId("onboarding-submit")).toBeDisabled();
    expect(createProfileMock).not.toHaveBeenCalled();
  });

  it("submits the chosen username with the age confirmation", async () => {
    const user = userEvent.setup();
    const onCompleted = vi.fn();
    render(<ProfileOnboardingDialog open onCompleted={onCompleted} />);

    await user.type(screen.getByTestId("onboarding-username-input"), "nova_runner");
    await user.click(screen.getByTestId("onboarding-age-checkbox"));
    await user.click(screen.getByTestId("onboarding-submit"));

    expect(createProfileMock).toHaveBeenCalledWith({
      address: walletState.address,
      username: "nova_runner",
      ageConfirmed: true,
    });
    expect(onCompleted).toHaveBeenCalled();
  });

  it("surfaces a server-side rejection such as a taken username", async () => {
    createProfileMock.mockResolvedValue({
      ok: false,
      message: "This username is already taken. Please choose a different name.",
    });

    const user = userEvent.setup();
    render(<ProfileOnboardingDialog open />);

    await user.type(screen.getByTestId("onboarding-username-input"), "nova_runner");
    await user.click(screen.getByTestId("onboarding-age-checkbox"));
    await user.click(screen.getByTestId("onboarding-submit"));

    expect(await screen.findByTestId("onboarding-error")).toHaveTextContent(/already taken/i);
  });
});
