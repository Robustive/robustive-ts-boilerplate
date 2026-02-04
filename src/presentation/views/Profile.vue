<script setup lang="ts">
import { inject, reactive, watch } from "vue"
import { FrontendService, SERVICE_KEY } from "@frontend/stores"
import { isAuthenticatedUser } from "@domain/actors/authenticatedUser"
import { Account, UsageStatus } from "@domain/models/authentication/user"
import { AccountRole } from "@domain/actors"
import { Views } from ".."

const { states, helpers } = inject<FrontendService>(SERVICE_KEY)!

// Default empty account
const emptyAccount: Account = {
  id: "",
  role: AccountRole.anonymous(),
  usageStatus: UsageStatus.activated,
  displayName: "Guest",
  name: {
    givenName: "",
    familyName: "",
  },
  email: "",
  photoUrl: undefined
}

const account = reactive<Account>({ ...emptyAccount })

const syncProfile = () => {
  const actor = states.shared.actor
  if (isAuthenticatedUser(actor)) {
    Object.assign(account, actor.account)
  } else {
    Object.assign(account, emptyAccount)
  }
}

// Initial sync
syncProfile()

// Watch for changes
watch(() => states.shared.actor, syncProfile)

const onEditProfile = () => {
  helpers.navigateTo(`${Views.Main.path}${Views.ProfileEdit.path}`)
}
</script>

<template>
  <v-container class="fill-height justify-center">
    <v-card width="600" elevation="2" rounded="lg">
      <v-img height="200" src="https://cdn.vuetifyjs.com/images/cards/server-room.jpg" cover></v-img>

      <div class="d-flex justify-center" style="margin-top: -50px; position: relative; z-index: 1;">
        <v-avatar size="100" class="elevation-4">
          <v-img v-if="account.photoUrl" :src="account.photoUrl" :alt="account.displayName" />
          <span class="text-h4" v-else>{{ account.displayName.charAt(0) }}</span>
        </v-avatar>
      </div>

      <v-card-text class="text-center pt-4">
        <h2 class="text-h5 font-weight-bold mb-1">{{ account.displayName }}</h2>
        <div class="text-body-2 text-medium-emphasis mb-4">{{ account.email }}</div>

        <v-divider class="my-3"></v-divider>

        <v-list lines="one" class="text-left">
          <v-list-item>
            <v-row align="center" no-gutters>
              <v-col cols="3" class="d-flex align-center">
                <v-icon icon="mdi-account" color="primary" class="mr-2"></v-icon>
                <div class="font-weight-bold">Name</div>
              </v-col>
              <v-col cols="9">
                {{ account.name.familyName }} {{ account.name.givenName }}
              </v-col>
            </v-row>
          </v-list-item>

          <v-list-item>
            <v-row align="center" no-gutters>
              <v-col cols="3" class="d-flex align-center">
                <v-icon icon="mdi-email" color="primary" class="mr-2"></v-icon>
                <div class="font-weight-bold">Email</div>
              </v-col>
              <v-col cols="9">
                {{ account.email }}
              </v-col>
            </v-row>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="onEditProfile">Edit Profile</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style scoped></style>
